import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import Decimal from "decimal.js";
import { createDevLogger } from "../../core/dev-logger";
import { DatabaseService } from "../../database/database.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
import { deriveEmploymentIncomeCandidate } from "./employment-income-candidate";
import { decodeTaxIncomeCursor, encodeTaxIncomeCursor } from "./tax-income.cursor";
import {
	type PublicTaxIncomeRecord,
	TAX_INCOME_REPOSITORY,
	type TaxIncomeRecord,
	type TaxIncomeRepositoryPort,
	type UpdateTaxIncomeValues,
} from "./tax-income.types";
import type {
	CreateTaxIncomeInput,
	DocumentDecisionInput,
	EmploymentCoverageResolutionInput,
	UpdateTaxIncomeInput,
} from "./tax-income.validation";
import { deriveFourthIncomeCandidate } from "./tax-income-candidate";

const performanceLog = createDevLogger("tax-income.performance");

@Injectable()
export class TaxIncomeService {
	constructor(
		@Inject(TAX_INCOME_REPOSITORY)
		private readonly repository: TaxIncomeRepositoryPort,
		private readonly database: DatabaseService,
		private readonly taxStatusService: TaxStatusService,
		private readonly taxProfileService: TaxProfileService,
	) {}

	async createManual(userId: string, input: CreateTaxIncomeInput) {
		const startedAt = Date.now();
		const profile = await this.getProfileForIncome(
			userId,
			"incomeType" in input ? "employment" : "fourth",
		);
		const profileDurationMs = Date.now() - startedAt;
		const transactionStartedAt = Date.now();
		let evaluationDurationMs: number | null = null;

		const result = await this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const existing = await this.repository.findByIdempotencyKey(
				tx,
				profile.id,
				input.idempotencyKey,
			);

			if (existing) {
				if (!this.matchesCreatePayload(existing, input)) {
					throw new ConflictException({
						code: "TAX_INCOME_IDEMPOTENCY_CONFLICT",
						message: "La clave de reintento ya fue usada con otros datos.",
					});
				}

				return {
					record: this.toPublicRecord(existing),
					taxStatus: await this.taxStatusService.getCurrent(userId),
				};
			}

			const inserted = await this.repository.insertManual(tx, {
				taxProfileId: profile.id,
				...input,
			});
			if (!inserted) {
				const winner = await this.repository.findByIdempotencyKey(
					tx,
					profile.id,
					input.idempotencyKey,
				);
				if (!winner) throw new Error("Idempotency conflict winner could not be read");
				if (!this.matchesCreatePayload(winner, input)) {
					throw new ConflictException({
						code: "TAX_INCOME_IDEMPOTENCY_CONFLICT",
						message: "La clave de reintento ya fue usada con otros datos.",
					});
				}
				return {
					record: this.toPublicRecord(winner),
					taxStatus: await this.taxStatusService.getCurrent(userId),
				};
			}
			let resolvedRecord = inserted;
			if ("incomeType" in input) {
				await this.repository.recalculateEmploymentCoverage(tx, profile.id);
				resolvedRecord = (await this.repository.getOwned(tx, profile.id, inserted.id)) ?? inserted;
			}
			const evaluationStartedAt = Date.now();
			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_created",
				incomeMode: profile.incomeMode,
			});
			evaluationDurationMs = Date.now() - evaluationStartedAt;

			return { record: this.toPublicRecord(resolvedRecord), taxStatus };
		});

		performanceLog.info("createManual:completed", {
			profileDurationMs,
			transactionDurationMs: Date.now() - transactionStartedAt,
			evaluationDurationMs,
			totalDurationMs: Date.now() - startedAt,
		});

		return result;
	}

	async update(userId: string, recordId: string, input: UpdateTaxIncomeInput) {
		const profile = await this.getProfileForIncome(
			userId,
			"incomeType" in input ? "employment" : "fourth",
		);

		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const current = await this.repository.getOwnedForUpdate(tx, profile.id, recordId);
			if (!current) throw this.notFound();
			if ((current.incomeType === "employment") !== "incomeType" in input) {
				throw new BadRequestException({
					code: "TAX_INCOME_KIND_MISMATCH",
					message: "El tipo de ingreso no coincide.",
				});
			}

			const grossAmount = input.grossAmount ?? current.grossAmount;
			const withheldTaxAmount = input.withheldTaxAmount ?? current.withheldTaxAmount;
			if (new Decimal(withheldTaxAmount).greaterThan(grossAmount)) {
				throw new BadRequestException({
					code: "TAX_INCOME_WITHHOLDING_EXCEEDS_GROSS",
					message: "La retención no puede superar el ingreso bruto.",
				});
			}

			if ("incomeType" in input) this.assertEmploymentUpdate(current, input);
			const values: UpdateTaxIncomeValues = input;
			let record = await this.repository.updateOwned(tx, profile.id, recordId, values);
			if (!record) throw this.notFound();
			if (record.incomeType === "employment") {
				await this.repository.recalculateEmploymentCoverage(tx, profile.id);
				record = (await this.repository.getOwned(tx, profile.id, recordId)) ?? record;
			}

			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_updated",
				incomeMode: profile.incomeMode,
			});

			return { record: this.toPublicRecord(record), taxStatus };
		});
	}

	async remove(userId: string, recordId: string) {
		const profile = await this.getProfileForIncome(userId, "any");

		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const current = await this.repository.getOwnedForUpdate(tx, profile.id, recordId);
			if (!current) throw this.notFound();

			const deletedAt = new Date();
			const record = await this.repository.softDeleteOwned(tx, profile.id, recordId, deletedAt);
			if (!record) throw this.notFound();
			if (current.incomeType === "employment") {
				await this.repository.recalculateEmploymentCoverage(tx, profile.id);
			}

			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_deleted",
				incomeMode: profile.incomeMode,
			});

			return {
				record: { id: record.id, deletedAt: deletedAt.toISOString() },
				taxStatus,
			};
		});
	}

	async resolveEmploymentCoverageConflict(
		userId: string,
		recordId: string,
		input: EmploymentCoverageResolutionInput,
	) {
		const profile = await this.getProfileForIncome(userId, "employment");
		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const current = await this.repository.getOwnedForUpdate(tx, profile.id, recordId);
			if (!current) throw this.notFound();
			if (current.incomeType !== "employment") {
				throw new BadRequestException({
					code: "TAX_INCOME_KIND_MISMATCH",
					message: "Solo se pueden resolver cruces de ingresos en planilla.",
				});
			}
			const manuallyResolved = await this.repository.resolveEmploymentCoverageConflict(
				tx,
				profile.id,
				current,
				input.decision,
			);
			if (!manuallyResolved) {
				throw new BadRequestException({
					code: "EMPLOYMENT_COVERAGE_RESOLUTION_INVALID",
					message: "No encontramos otro registro que pueda resolver este cruce.",
				});
			}
			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_updated",
				incomeMode: profile.incomeMode,
			});
			return { record: this.toPublicRecord(manuallyResolved), taxStatus };
		});
	}

	async getOne(userId: string, recordId: string) {
		const profile = await this.getProfileForIncome(userId, "any");
		const record = await this.repository.getOwned(undefined, profile.id, recordId);
		if (!record) throw this.notFound();
		return this.toPublicRecord(record);
	}

	async list(
		userId: string,
		query: {
			year: number;
			cursor?: string;
			limit?: number;
			type?: "all" | "employment" | "fourth";
		},
	) {
		const profile = await this.getProfileForIncome(userId, "any");
		if (query.year !== 2026) {
			throw new BadRequestException({
				code: "TAX_YEAR_NOT_SUPPORTED",
				message: "Este listado solo está disponible para el año 2026.",
			});
		}

		const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
		let cursorRow: TaxIncomeRecord | undefined;
		let decodedCursor: ReturnType<typeof decodeTaxIncomeCursor> | undefined;
		if (query.cursor) {
			try {
				decodedCursor = decodeTaxIncomeCursor(query.cursor);
			} catch {
				throw new BadRequestException({ message: "El cursor de paginación no es válido." });
			}
			cursorRow = await this.repository.getOwned(undefined, profile.id, decodedCursor.id);
			if (
				!cursorRow ||
				this.orderingDate(cursorRow) !== decodedCursor.receivedAt ||
				cursorRow.createdAt.toISOString() !== decodedCursor.createdAt
			) {
				throw new BadRequestException({ message: "El cursor de paginación no es válido." });
			}
		}

		const [rows, summary] = await Promise.all([
			this.repository.listVisible(undefined, profile.id, {
				cursor: cursorRow
					? {
							receivedAt: this.orderingDate(cursorRow),
							createdAt: cursorRow.createdAt.toISOString(),
							id: cursorRow.id,
						}
					: undefined,
				limit,
				type: query.type ?? "all",
			}),
			this.repository.sumVisible(undefined, profile.id, 2026),
		]);
		const hasNextPage = rows.length > limit;
		const pageRows = rows.slice(0, limit);
		const lastRow = pageRows.at(-1);

		return {
			items: pageRows.map((record) => this.toPublicRecord(record)),
			nextCursor:
				hasNextPage && lastRow
					? encodeTaxIncomeCursor({
							receivedAt: this.orderingDate(lastRow),
							createdAt: lastRow.createdAt.toISOString(),
							id: lastRow.id,
						})
					: null,
			summary,
		};
	}

	async getDocumentCandidateForProfile(taxProfileId: string, documentId: string) {
		const source = await this.repository.getDocumentCandidateSource(
			undefined,
			taxProfileId,
			documentId,
		);
		return source ? deriveFourthIncomeCandidate(source) : null;
	}

	async getEmploymentDocumentCandidateForProfile(taxProfileId: string, documentId: string) {
		const source = await this.repository.getDocumentCandidateSource(
			undefined,
			taxProfileId,
			documentId,
		);
		return source ? deriveEmploymentIncomeCandidate(source) : null;
	}

	async decideDocument(userId: string, input: DocumentDecisionInput) {
		const profile = await this.getProfileForIncome(
			userId,
			input.decision === "employment_confirmed" ? "employment" : "fourth",
		);
		const outcome = await this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const document = await this.repository.getDocumentForUpdate(tx, profile.id, input.documentId);
			if (!document) {
				throw new NotFoundException({
					code: "SOURCE_DOCUMENT_NOT_FOUND",
					message: "No se encontró el comprobante fuente.",
				});
			}
			if (document.status !== "ready" && document.status !== "needs_review") {
				throw new ConflictException({
					code: "SOURCE_DOCUMENT_NOT_READY",
					message: "El comprobante todavía no está listo.",
				});
			}
			if (
				input.decision === "employment_confirmed" &&
				!(["payroll_slip", "withholding_certificate", "sunat_document"] as const).includes(
					document.documentType as "payroll_slip",
				)
			) {
				throw new ConflictException({
					code: "SOURCE_DOCUMENT_NOT_EMPLOYMENT_EVIDENCE",
					message: "El documento no es evidencia de quinta categoría.",
				});
			}
			if (input.decision !== "employment_confirmed" && document.documentType !== "fee_receipt") {
				throw new ConflictException({
					code: "SOURCE_DOCUMENT_NOT_FEE_RECEIPT",
					message: "El comprobante no es un recibo por honorarios.",
				});
			}

			const existing = await this.repository.findActiveBySourceDocument(
				tx,
				profile.id,
				input.documentId,
			);
			if (input.decision === "employment_confirmed") {
				if (document.currencyCode !== "PEN") {
					throw new ConflictException({
						code: "TAX_CURRENCY_NOT_SUPPORTED",
						message: "Solo se admiten ingresos en soles.",
					});
				}
				if (existing) {
					if (!this.matchesEmploymentPayload(existing, input)) {
						throw new ConflictException({
							code: "SOURCE_DOCUMENT_INCOME_ALREADY_CONFIRMED",
							message: "Edita el ingreso ya registrado.",
						});
					}
					return { kind: "existing" as const, record: existing };
				}
				const inserted = await this.repository.insertDocumentIncome(tx, {
					taxProfileId: profile.id,
					sourceDocumentId: input.documentId,
					incomeType: "employment",
					recordKind: input.recordKind,
					coverageStart: input.coverageStart,
					coverageEnd: input.coverageEnd,
					coverageScope: input.coverageScope,
					grossAmount: input.grossAmount,
					withheldTaxAmount: input.withheldTaxAmount,
					payerName: input.payerName ?? null,
					payerTaxId: input.payerTaxId ?? null,
					notes: input.notes ?? null,
				});
				let record =
					inserted ??
					(await this.repository.findActiveBySourceDocument(tx, profile.id, input.documentId));
				if (!record) throw new Error("Document income conflict winner could not be read");
				await this.repository.recalculateEmploymentCoverage(tx, profile.id);
				record = (await this.repository.getOwned(tx, profile.id, record.id)) ?? record;
				const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
					taxProfileId: profile.id,
					taxYear: 2026,
					triggeredBy: "document_income_confirmed",
					incomeMode: profile.incomeMode,
				});
				return { kind: "created" as const, record, taxStatus };
			}
			if (input.decision === "not_mine") {
				if (existing) {
					throw new ConflictException({
						code: "SOURCE_DOCUMENT_INCOME_ALREADY_CONFIRMED",
						message: "Este recibo ya fue registrado como ingreso.",
					});
				}
				await this.repository.resolveFourthIncomeAttention(tx, profile.id, input.documentId, {
					decision: "not_mine",
				});
				return { kind: "not_mine" as const };
			}
			if (
				input.decision === "unpaid" ||
				input.decision === "unsure" ||
				input.decision === "activity_unsure"
			) {
				if (existing) {
					throw new ConflictException({
						code: "SOURCE_DOCUMENT_INCOME_ALREADY_CONFIRMED",
						message: "Este recibo ya fue registrado como ingreso.",
					});
				}
				await this.repository.keepFourthIncomeAttentionOpen(
					tx,
					profile.id,
					input.documentId,
					input.decision,
				);
				return { kind: "pending" as const };
			}
			if (input.decision !== "paid") {
				throw new Error("Unsupported document income decision");
			}

			if (document.currencyCode !== "PEN") {
				throw new ConflictException({
					code: "TAX_CURRENCY_NOT_SUPPORTED",
					message: "Este vertical solo admite ingresos en soles.",
				});
			}
			if (existing) {
				if (!this.matchesDocumentPayload(existing, input)) {
					throw new ConflictException({
						code: "SOURCE_DOCUMENT_INCOME_ALREADY_CONFIRMED",
						message: "Edita el ingreso ya registrado para cambiar sus datos.",
					});
				}
				await this.repository.resolveFourthIncomeAttention(tx, profile.id, input.documentId, {
					decision: "paid",
					incomeRecordId: existing.id,
				});
				return { kind: "existing" as const, record: existing };
			}

			const inserted = await this.repository.insertDocumentIncome(tx, {
				taxProfileId: profile.id,
				sourceDocumentId: input.documentId,
				activityType: input.activityType,
				receivedAt: input.receivedAt,
				grossAmount: input.grossAmount,
				withheldTaxAmount: input.withheldTaxAmount,
				payerName: input.payerName ?? null,
				notes: input.notes ?? null,
			});
			const record =
				inserted ??
				(await this.repository.findActiveBySourceDocument(tx, profile.id, input.documentId));
			if (!record) throw new Error("Document income conflict winner could not be read");

			await this.repository.resolveFourthIncomeAttention(tx, profile.id, input.documentId, {
				decision: "paid",
				incomeRecordId: record.id,
			});
			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "document_income_confirmed",
				incomeMode: profile.incomeMode,
			});
			return { kind: "created" as const, record, taxStatus };
		});

		if (outcome.kind === "not_mine" || outcome.kind === "pending") {
			return { record: null, taxStatus: await this.taxStatusService.getCurrent(userId) };
		}
		if (outcome.kind === "existing") {
			return {
				record: this.toPublicRecord(outcome.record),
				taxStatus: await this.taxStatusService.getCurrent(userId),
			};
		}
		return { record: this.toPublicRecord(outcome.record), taxStatus: outcome.taxStatus };
	}

	private async getProfileForIncome(userId: string, kind: "fourth" | "employment" | "any") {
		const current = await this.taxProfileService.getCurrentUser(userId);
		if (current.requiresOnboarding || !current.profile) {
			throw new ConflictException({
				code: "TAX_PROFILE_REQUIRED",
				message: "Completa tu perfil tributario para continuar.",
			});
		}
		if (current.taxYear !== 2026 || current.profile.taxYear !== 2026) {
			throw new ConflictException({
				code: "TAX_YEAR_NOT_SUPPORTED",
				message: "Este registro solo está disponible para el año 2026.",
			});
		}
		const mode = current.profile.incomeMode;
		const allowed =
			kind === "any" ||
			(kind === "fourth" && (mode === "independent" || mode === "mixed")) ||
			(kind === "employment" && (mode === "employment" || mode === "mixed"));
		if (!allowed) {
			throw new ConflictException({
				code: "TAX_PROFILE_MODE_NOT_SUPPORTED",
				message: "Este registro está disponible para ingresos independientes.",
			});
		}

		return current.profile;
	}

	private matchesCreatePayload(record: TaxIncomeRecord, input: CreateTaxIncomeInput) {
		if ("incomeType" in input) {
			return (
				record.incomeType === "employment" &&
				record.recordKind === input.recordKind &&
				record.coverageStart === input.coverageStart &&
				record.coverageEnd === input.coverageEnd &&
				record.coverageScope === input.coverageScope &&
				record.grossAmount === input.grossAmount &&
				record.withheldTaxAmount === input.withheldTaxAmount &&
				record.payerName === (input.payerName ?? null) &&
				record.payerTaxId === (input.payerTaxId ?? null) &&
				record.notes === (input.notes ?? null)
			);
		}
		return (
			record.incomeType === input.activityType &&
			record.receivedAt === input.receivedAt &&
			record.grossAmount === input.grossAmount &&
			record.withheldTaxAmount === input.withheldTaxAmount &&
			record.payerName === (input.payerName ?? null) &&
			record.notes === (input.notes ?? null)
		);
	}

	private matchesEmploymentPayload(
		record: TaxIncomeRecord,
		input: Extract<DocumentDecisionInput, { decision: "employment_confirmed" }>,
	) {
		return (
			record.incomeType === "employment" &&
			record.recordKind === input.recordKind &&
			record.coverageStart === input.coverageStart &&
			record.coverageEnd === input.coverageEnd &&
			record.coverageScope === input.coverageScope &&
			record.grossAmount === input.grossAmount &&
			record.withheldTaxAmount === input.withheldTaxAmount &&
			record.payerName === (input.payerName ?? null) &&
			record.payerTaxId === (input.payerTaxId ?? null)
		);
	}

	private assertEmploymentUpdate(
		current: TaxIncomeRecord,
		input: Extract<UpdateTaxIncomeInput, { incomeType: "employment" }>,
	) {
		const coverageStart = input.coverageStart ?? current.coverageStart;
		const coverageEnd = input.coverageEnd ?? current.coverageEnd;
		const recordKind = input.recordKind ?? current.recordKind;
		const coverageScope = input.coverageScope ?? current.coverageScope;
		const payerName = input.payerName === undefined ? current.payerName : input.payerName;
		const payerTaxId = input.payerTaxId === undefined ? current.payerTaxId : input.payerTaxId;
		if (!coverageStart || !coverageEnd || coverageStart > coverageEnd) {
			throw new BadRequestException({
				code: "TAX_INCOME_COVERAGE_INVALID",
				message: "El rango de cobertura no es válido.",
			});
		}
		if (coverageScope === "all_employers" && recordKind !== "year_to_date_snapshot") {
			throw new BadRequestException({
				code: "TAX_INCOME_COVERAGE_INVALID",
				message: "La cobertura de todos los empleadores requiere un acumulado.",
			});
		}
		if (coverageScope === "single_payer" && !payerName && !payerTaxId) {
			throw new BadRequestException({
				code: "TAX_INCOME_PAYER_REQUIRED",
				message: "Identifica al empleador.",
			});
		}
	}

	private matchesDocumentPayload(
		record: TaxIncomeRecord,
		input: Extract<DocumentDecisionInput, { decision: "paid" }>,
	) {
		return (
			record.incomeType === input.activityType &&
			record.receivedAt === input.receivedAt &&
			record.grossAmount === input.grossAmount &&
			record.withheldTaxAmount === input.withheldTaxAmount &&
			record.payerName === (input.payerName ?? null) &&
			record.notes === (input.notes ?? null)
		);
	}

	private toPublicRecord(record: TaxIncomeRecord): PublicTaxIncomeRecord {
		const { taxProfileId, idempotencyKey, exchangeRate, ...publicRecord } = record;
		void taxProfileId;
		void idempotencyKey;
		void exchangeRate;
		return publicRecord;
	}

	private orderingDate(record: TaxIncomeRecord): string {
		const value = record.receivedAt ?? record.coverageEnd;
		if (!value) throw new Error("Tax income record is missing its ordering date");
		return value;
	}

	private notFound() {
		return new NotFoundException({
			code: "TAX_INCOME_NOT_FOUND",
			message: "No se encontró el ingreso.",
		});
	}
}
