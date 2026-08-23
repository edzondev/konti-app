import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
	ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDniBlindIndex } from "../../core/security/dni-blind-index";
import { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
import { AdditionalDeductionRules } from "./additional-deduction.rules";
import {
	type CanonicalTaxDeductionInput,
	type StoredTaxDeductionRecord,
	TAX_DEDUCTION_REPOSITORY,
	type TaxDeductionRepositoryPort,
} from "./tax-deduction.persistence.types";
import type { TaxDeductionCategory, TaxDeductionRecord } from "./tax-deduction.types";
import type {
	CreateTaxDeductionInput,
	DeductionMutationData,
	DocumentTaxDeductionDecisionInput,
	UpdateTaxDeductionInput,
} from "./tax-deduction.validation";
import { deriveTaxDeductionCandidate } from "./tax-deduction-candidate";

const ZERO_BY_CATEGORY = {
	restaurants_hotels: "0.00",
	medical_dental_services: "0.00",
	other_fourth_services: "0.00",
	rent: "0.00",
	household_worker_essalud: "0.00",
} as const satisfies Record<TaxDeductionCategory, string>;

@Injectable()
export class TaxDeductionService {
	private readonly rules = new AdditionalDeductionRules();

	constructor(
		@Inject(TAX_DEDUCTION_REPOSITORY)
		private readonly repository: TaxDeductionRepositoryPort,
		private readonly database: DatabaseService,
		private readonly taxStatusService: TaxStatusService,
		private readonly taxProfileService: TaxProfileService,
		private readonly config: ConfigService,
	) {}

	async createManual(userId: string, input: CreateTaxDeductionInput) {
		const profile = await this.getProfile(userId);
		const prepared = this.prepare(input, null);
		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfile(tx, profile.id);
			await this.storeIdentityIfProvided(tx, profile.id, input.consumerDni);
			const existing = await this.repository.findByIdempotencyKey(
				tx,
				profile.id,
				input.idempotencyKey,
			);
			if (existing) {
				if (!this.matches(existing, prepared.input)) throw this.idempotencyConflict();
				return this.buildCollection(tx, profile.id);
			}
			const inserted = await this.repository.insert(tx, {
				taxProfileId: profile.id,
				sourceDocumentId: null,
				source: "manual",
				idempotencyKey: input.idempotencyKey,
				input: prepared.input,
				eligibleBase: prepared.eligibleBase,
				attentionReasons: prepared.attentionReasons,
			});
			const record =
				inserted ??
				(await this.repository.findByIdempotencyKey(tx, profile.id, input.idempotencyKey));
			if (!record) throw new Error("Tax deduction idempotency winner could not be read");
			if (!this.matches(record, prepared.input)) throw this.idempotencyConflict();
			await this.repository.syncAttention(
				tx,
				profile.id,
				record.id,
				null,
				prepared.attentionReasons,
			);
			await this.evaluate(tx, profile, "tax_deduction_created");
			return this.buildCollection(tx, profile.id);
		});
	}

	async decideDocument(userId: string, input: DocumentTaxDeductionDecisionInput) {
		const profile = await this.getProfile(userId);
		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfile(tx, profile.id);
			await this.storeIdentityIfProvided(tx, profile.id, input.consumerDni);
			const document = await this.repository.getDocumentForUpdate(tx, profile.id, input.documentId);
			if (!document) throw new NotFoundException({ code: "SOURCE_DOCUMENT_NOT_FOUND" });
			if (document.status !== "ready" && document.status !== "needs_review") {
				throw new ConflictException({ code: "SOURCE_DOCUMENT_NOT_READY" });
			}
			if (document.currencyCode !== "PEN") {
				throw new ConflictException({ code: "TAX_CURRENCY_NOT_SUPPORTED" });
			}
			const prepared = this.prepare(input, input.documentId);
			const existing = await this.repository.findActiveBySourceDocument(
				tx,
				profile.id,
				input.documentId,
			);
			if (existing) {
				if (!this.matches(existing, prepared.input)) {
					throw new ConflictException({ code: "SOURCE_DOCUMENT_DEDUCTION_ALREADY_CONFIRMED" });
				}
				return this.buildCollection(tx, profile.id);
			}
			const inserted = await this.repository.insert(tx, {
				taxProfileId: profile.id,
				sourceDocumentId: input.documentId,
				source: "document",
				idempotencyKey: null,
				input: prepared.input,
				eligibleBase: prepared.eligibleBase,
				attentionReasons: prepared.attentionReasons,
			});
			const record =
				inserted ??
				(await this.repository.findActiveBySourceDocument(tx, profile.id, input.documentId));
			if (!record) throw new Error("Document deduction conflict winner could not be read");
			await this.repository.syncAttention(
				tx,
				profile.id,
				record.id,
				input.documentId,
				prepared.attentionReasons,
			);
			await this.evaluate(tx, profile, "document_deduction_confirmed");
			return this.buildCollection(tx, profile.id);
		});
	}

	async update(userId: string, recordId: string, input: UpdateTaxDeductionInput) {
		const profile = await this.getProfile(userId);
		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfile(tx, profile.id);
			await this.storeIdentityIfProvided(tx, profile.id, input.consumerDni);
			const current = await this.repository.getOwned(tx, profile.id, recordId, true);
			if (!current) throw this.notFound();
			const prepared = this.prepare(input, current.sourceDocumentId);
			const record = await this.repository.updateOwned(
				tx,
				profile.id,
				recordId,
				prepared.input,
				prepared.eligibleBase,
				prepared.attentionReasons,
			);
			if (!record) throw this.notFound();
			await this.repository.syncAttention(
				tx,
				profile.id,
				recordId,
				record.sourceDocumentId,
				prepared.attentionReasons,
			);
			await this.evaluate(tx, profile, "tax_deduction_updated");
			return this.buildCollection(tx, profile.id);
		});
	}

	async remove(userId: string, recordId: string) {
		const profile = await this.getProfile(userId);
		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfile(tx, profile.id);
			const current = await this.repository.getOwned(tx, profile.id, recordId, true);
			if (!current) throw this.notFound();
			await this.repository.softDeleteOwned(tx, profile.id, recordId, new Date());
			await this.repository.syncAttention(tx, profile.id, recordId, current.sourceDocumentId, []);
			await this.evaluate(tx, profile, "tax_deduction_deleted");
			return this.buildCollection(tx, profile.id);
		});
	}

	async list(userId: string) {
		const profile = await this.getProfile(userId);
		return this.buildCollection(undefined, profile.id);
	}

	async getOne(userId: string, recordId: string) {
		const profile = await this.getProfile(userId);
		const record = await this.repository.getOwned(undefined, profile.id, recordId);
		if (!record) throw this.notFound();
		return this.toPublic(record);
	}

	async storeIdentity(userId: string, dni: string) {
		const profile = await this.getProfile(userId);
		try {
			const secret = this.config.getOrThrow<string>("KONTI_DNI_HMAC_KEY");
			const identity = createDniBlindIndex(dni, secret);
			await this.database.db.transaction(async (tx) => {
				await this.repository.lockTaxProfile(tx, profile.id);
				await this.repository.storeDniIdentity(tx, profile.id, identity.blindIndex, identity.last4);
			});
			return { configured: true, identityMasked: `****${identity.last4}` };
		} catch {
			throw new ServiceUnavailableException({ code: "DNI_VERIFICATION_FAILED" });
		}
	}

	async getDocumentCandidateForProfile(taxProfileId: string, documentId: string) {
		const source = await this.repository.getDocumentCandidateSource(
			undefined,
			taxProfileId,
			documentId,
		);
		return source ? deriveTaxDeductionCandidate(source) : null;
	}

	private prepare(input: DeductionMutationData, sourceDocumentId: string | null) {
		if (input.verificationBasis === "evidence_attached" && !sourceDocumentId) {
			throw new ConflictException({ code: "TAX_DEDUCTION_EVIDENCE_REQUIRED" });
		}
		const verificationStatus =
			input.verificationBasis === "unresolved"
				? "unknown"
				: input.verificationBasis === "user_confirmation"
					? "user_confirmed"
					: "evidence_attached";
		const provisional = this.toCanonical(input, verificationStatus, "included");
		const decision = this.rules.calculate([this.toRulesRecord("candidate", provisional)])
			.decisions[0];
		if (!decision) throw new Error("Deduction decision was not produced");
		const canonical = { ...provisional, calculationStatus: decision.disposition };
		return {
			input: canonical,
			eligibleBase: decision.qualifyingBasePen ?? input.grossAmountPen,
			attentionReasons: decision.attentionReasons,
		};
	}

	private toCanonical(
		input: DeductionMutationData,
		verificationStatus: CanonicalTaxDeductionInput["verificationStatus"],
		calculationStatus: CanonicalTaxDeductionInput["calculationStatus"],
	): CanonicalTaxDeductionInput {
		return {
			category: input.category,
			expenseDate: input.paidAt,
			grossAmount: input.grossAmountPen,
			verificationStatus,
			calculationStatus,
			requirements: input.requirements,
			notes: null,
			beneficiary: input.category === "medical_dental_services" ? input.medical.beneficiary : null,
			insuranceReimbursementAmount:
				input.category === "medical_dental_services"
					? input.medical.insuranceReimbursementAmountPen
					: null,
			fourthActivityType:
				input.category === "other_fourth_services" ? input.fourthActivityType : null,
			attribution: input.category === "rent" ? input.rentAttribution : null,
		};
	}

	private toRulesRecord(id: string, input: CanonicalTaxDeductionInput): TaxDeductionRecord {
		const common = {
			id,
			paidAt: input.expenseDate,
			grossAmountPen: input.grossAmount,
			verificationStatus: input.verificationStatus,
			calculationStatus: input.calculationStatus,
			requirements: input.requirements,
		};
		if (input.category === "medical_dental_services" && input.beneficiary) {
			return {
				...common,
				category: input.category,
				beneficiary: input.beneficiary,
				insuranceReimbursementAmountPen: input.insuranceReimbursementAmount,
			};
		}
		if (input.category === "other_fourth_services" && input.fourthActivityType) {
			return { ...common, category: input.category, fourthActivityType: input.fourthActivityType };
		}
		if (input.category === "rent" && input.attribution) {
			return { ...common, category: input.category, attribution: input.attribution };
		}
		return { ...common, category: input.category } as TaxDeductionRecord;
	}

	private matches(record: StoredTaxDeductionRecord, input: CanonicalTaxDeductionInput) {
		if (
			record.category !== input.category ||
			record.paidAt !== input.expenseDate ||
			record.grossAmountPen !== input.grossAmount ||
			record.verificationStatus !== input.verificationStatus ||
			record.calculationStatus !== input.calculationStatus ||
			record.notes !== input.notes ||
			JSON.stringify([...record.requirements].sort((a, b) => a.code.localeCompare(b.code))) !==
				JSON.stringify([...input.requirements].sort((a, b) => a.code.localeCompare(b.code)))
		) {
			return false;
		}
		if (input.category === "medical_dental_services") {
			return (
				record.category === "medical_dental_services" &&
				record.beneficiary === input.beneficiary &&
				record.insuranceReimbursementAmountPen === input.insuranceReimbursementAmount
			);
		}
		if (input.category === "other_fourth_services") {
			return (
				record.category === "other_fourth_services" &&
				record.fourthActivityType === input.fourthActivityType
			);
		}
		if (input.category === "rent") {
			return record.category === "rent" && record.attribution === input.attribution;
		}
		return true;
	}

	private async buildCollection(executor: DatabaseExecutor | undefined, taxProfileId: string) {
		const [records, identityLast4] = await Promise.all([
			this.repository.listVisible(executor, taxProfileId),
			this.repository.getDniIdentityLast4(executor, taxProfileId),
		]);
		const result = this.rules.calculate(records);
		return {
			taxYear: 2026 as const,
			identityMasked: identityLast4 ? `****${identityLast4}` : null,
			summary: {
				includedDeductionPen: result.includedAdditionalDeduction,
				potentialDeductionPen: result.potentialAmountBeforeCap,
				capPen: result.capPen,
				amountDiscardedByCapPen: result.amountDiscardedByCap,
				byCategory: {
					...ZERO_BY_CATEGORY,
					restaurants_hotels: result.restaurantsHotelsDeduction,
					medical_dental_services: result.medicalDentalDeduction,
					other_fourth_services: result.otherFourthServicesDeduction,
					rent: result.rentDeduction,
					household_worker_essalud: result.householdWorkerEssaludDeduction,
				},
			},
			records: records.map((record) => this.toPublic(record)),
		};
	}

	private async storeIdentityIfProvided(
		executor: DatabaseExecutor,
		taxProfileId: string,
		dni: string | undefined,
	): Promise<void> {
		if (!dni) return;
		try {
			const secret = this.config.getOrThrow<string>("KONTI_DNI_HMAC_KEY");
			const identity = createDniBlindIndex(dni, secret);
			await this.repository.storeDniIdentity(
				executor,
				taxProfileId,
				identity.blindIndex,
				identity.last4,
			);
		} catch {
			throw new ServiceUnavailableException({ code: "DNI_VERIFICATION_FAILED" });
		}
	}

	private toPublic(record: StoredTaxDeductionRecord) {
		return {
			id: record.id,
			category: record.category,
			paidAt: record.paidAt,
			grossAmountPen: record.grossAmountPen,
			verificationStatus: record.verificationStatus,
			calculationStatus: record.calculationStatus,
			sourceDocumentId: record.sourceDocumentId,
			requirements: record.requirements,
			medical:
				record.category === "medical_dental_services"
					? {
							beneficiary: record.beneficiary,
							insuranceReimbursementAmountPen: record.insuranceReimbursementAmountPen,
						}
					: null,
			fourthActivityType:
				record.category === "other_fourth_services" ? record.fourthActivityType : null,
			rentAttribution: record.category === "rent" ? record.attribution : null,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	private evaluate(
		executor: DatabaseExecutor,
		profile: { id: string; incomeMode: "independent" | "employment" | "mixed" },
		triggeredBy:
			| "tax_deduction_created"
			| "document_deduction_confirmed"
			| "tax_deduction_updated"
			| "tax_deduction_deleted",
	) {
		return this.taxStatusService.evaluateAndPersist(executor, {
			taxProfileId: profile.id,
			taxYear: 2026,
			incomeMode: profile.incomeMode,
			triggeredBy,
		});
	}

	private async getProfile(userId: string) {
		const current = await this.taxProfileService.getCurrentUser(userId);
		if (current.requiresOnboarding || !current.profile) {
			throw new ConflictException({ code: "TAX_PROFILE_REQUIRED" });
		}
		if (current.taxYear !== 2026 || current.profile.taxYear !== 2026) {
			throw new ConflictException({ code: "TAX_YEAR_NOT_SUPPORTED" });
		}
		if (!current.profile.trackDeductibles) {
			throw new ConflictException({ code: "TAX_DEDUCTIONS_NOT_ENABLED" });
		}
		if (!current.profile.incomeMode) {
			throw new ConflictException({ code: "TAX_PROFILE_REQUIRED" });
		}
		return { ...current.profile, incomeMode: current.profile.incomeMode };
	}

	private notFound() {
		return new NotFoundException({ code: "TAX_DEDUCTION_NOT_FOUND" });
	}

	private idempotencyConflict() {
		return new ConflictException({ code: "TAX_DEDUCTION_IDEMPOTENCY_CONFLICT" });
	}
}
