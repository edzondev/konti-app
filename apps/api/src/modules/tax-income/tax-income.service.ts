import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import Decimal from "decimal.js";
import { DatabaseService } from "../../database/database.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
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
	UpdateTaxIncomeInput,
} from "./tax-income.validation";
import { deriveFourthIncomeCandidate } from "./tax-income-candidate";

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
		const profile = await this.getIndependentProfile(userId);

		return this.database.db.transaction(async (tx) => {
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
				idempotencyKey: input.idempotencyKey,
				receivedAt: input.receivedAt,
				grossAmount: input.grossAmount,
				withheldTaxAmount: input.withheldTaxAmount,
				payerName: input.payerName ?? null,
				notes: input.notes ?? null,
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
			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_created",
			});

			return { record: this.toPublicRecord(inserted), taxStatus };
		});
	}

	async update(userId: string, recordId: string, input: UpdateTaxIncomeInput) {
		const profile = await this.getIndependentProfile(userId);

		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const current = await this.repository.getOwnedForUpdate(tx, profile.id, recordId);
			if (!current) throw this.notFound();

			const grossAmount = input.grossAmount ?? current.grossAmount;
			const withheldTaxAmount = input.withheldTaxAmount ?? current.withheldTaxAmount;
			if (new Decimal(withheldTaxAmount).greaterThan(grossAmount)) {
				throw new BadRequestException({
					code: "TAX_INCOME_WITHHOLDING_EXCEEDS_GROSS",
					message: "La retención no puede superar el ingreso bruto.",
				});
			}

			const values: UpdateTaxIncomeValues = {
				receivedAt: input.receivedAt,
				grossAmount: input.grossAmount,
				withheldTaxAmount: input.withheldTaxAmount,
				payerName: input.payerName,
				notes: input.notes,
			};
			const record = await this.repository.updateOwned(tx, profile.id, recordId, values);
			if (!record) throw this.notFound();

			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_updated",
			});

			return { record: this.toPublicRecord(record), taxStatus };
		});
	}

	async remove(userId: string, recordId: string) {
		const profile = await this.getIndependentProfile(userId);

		return this.database.db.transaction(async (tx) => {
			await this.repository.lockTaxProfileForEvaluation(tx, profile.id);
			const current = await this.repository.getOwnedForUpdate(tx, profile.id, recordId);
			if (!current) throw this.notFound();

			const deletedAt = new Date();
			const record = await this.repository.softDeleteOwned(tx, profile.id, recordId, deletedAt);
			if (!record) throw this.notFound();

			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "tax_income_deleted",
			});

			return {
				record: { id: record.id, deletedAt: deletedAt.toISOString() },
				taxStatus,
			};
		});
	}

	async getOne(userId: string, recordId: string) {
		const profile = await this.getIndependentProfile(userId);
		const record = await this.repository.getOwned(undefined, profile.id, recordId);
		if (!record) throw this.notFound();
		return this.toPublicRecord(record);
	}

	async list(userId: string, query: { year: number; cursor?: string; limit?: number }) {
		const profile = await this.getIndependentProfile(userId);
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
				cursorRow.receivedAt !== decodedCursor.receivedAt ||
				cursorRow.createdAt.toISOString() !== decodedCursor.createdAt
			) {
				throw new BadRequestException({ message: "El cursor de paginación no es válido." });
			}
		}

		const [rows, summary] = await Promise.all([
			this.repository.listVisible(undefined, profile.id, {
				cursor: cursorRow
					? {
							receivedAt: cursorRow.receivedAt,
							createdAt: cursorRow.createdAt.toISOString(),
							id: cursorRow.id,
						}
					: undefined,
				limit,
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
							receivedAt: lastRow.receivedAt,
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

	async decideDocument(userId: string, input: DocumentDecisionInput) {
		const profile = await this.getIndependentProfile(userId);
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
			if (document.documentType !== "fee_receipt") {
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
					decision: "confirmed",
					incomeRecordId: existing.id,
				});
				return { kind: "existing" as const, record: existing };
			}

			const inserted = await this.repository.insertDocumentIncome(tx, {
				taxProfileId: profile.id,
				sourceDocumentId: input.documentId,
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
				decision: "confirmed",
				incomeRecordId: record.id,
			});
			const taxStatus = await this.taxStatusService.evaluateAndPersist(tx, {
				taxProfileId: profile.id,
				taxYear: 2026,
				triggeredBy: "document_income_confirmed",
			});
			return { kind: "created" as const, record, taxStatus };
		});

		if (outcome.kind === "not_mine") {
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

	private async getIndependentProfile(userId: string) {
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
		if (current.profile.incomeMode !== "independent") {
			throw new ConflictException({
				code: "TAX_PROFILE_MODE_NOT_SUPPORTED",
				message: "Este registro está disponible para ingresos independientes.",
			});
		}

		return current.profile;
	}

	private matchesCreatePayload(record: TaxIncomeRecord, input: CreateTaxIncomeInput) {
		return (
			record.receivedAt === input.receivedAt &&
			record.grossAmount === input.grossAmount &&
			record.withheldTaxAmount === input.withheldTaxAmount &&
			record.payerName === (input.payerName ?? null) &&
			record.notes === (input.notes ?? null)
		);
	}

	private matchesDocumentPayload(
		record: TaxIncomeRecord,
		input: Extract<DocumentDecisionInput, { decision: "confirmed" }>,
	) {
		return (
			record.receivedAt === input.receivedAt &&
			record.grossAmount === input.grossAmount &&
			record.withheldTaxAmount === input.withheldTaxAmount &&
			record.payerName === (input.payerName ?? null) &&
			record.notes === (input.notes ?? null)
		);
	}

	private toPublicRecord(record: TaxIncomeRecord): PublicTaxIncomeRecord {
		const { taxProfileId, idempotencyKey, payerTaxId, exchangeRate, ...publicRecord } = record;
		void taxProfileId;
		void idempotencyKey;
		void payerTaxId;
		void exchangeRate;
		return publicRecord;
	}

	private notFound() {
		return new NotFoundException({
			code: "TAX_INCOME_NOT_FOUND",
			message: "No se encontró el ingreso.",
		});
	}
}
