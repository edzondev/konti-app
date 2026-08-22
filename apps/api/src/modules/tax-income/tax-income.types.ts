import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxIncomeCursor } from "./tax-income.cursor";
import type { UpdateTaxIncomeInput } from "./tax-income.validation";
import type { FourthIncomeCandidateSource } from "./tax-income-candidate";

export const TAX_INCOME_REPOSITORY = Symbol("TAX_INCOME_REPOSITORY");

export type TaxIncomeRecord = {
	id: string;
	taxProfileId: string;
	sourceDocumentId: string | null;
	incomeType: "independent_services";
	source: "manual" | "document";
	idempotencyKey: string | null;
	receivedAt: string;
	grossAmount: string;
	withheldTaxAmount: string;
	currencyCode: "PEN";
	exchangeRate: null;
	grossAmountPen: string;
	withheldTaxAmountPen: string;
	payerName: string | null;
	payerTaxId: null;
	status: "confirmed";
	notes: string | null;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type InsertManualTaxIncome = {
	taxProfileId: string;
	idempotencyKey: string;
	receivedAt: string;
	grossAmount: string;
	withheldTaxAmount: string;
	payerName: string | null;
	notes: string | null;
};

export type TaxIncomeSourceDocument = {
	id: string;
	taxProfileId: string;
	status: string;
	documentType: string;
	currencyCode: string | null;
	issueDate: string | null;
	taxRelevanceStatus: string;
	normalizedResult: Record<string, unknown>;
};

export type InsertDocumentTaxIncome = {
	taxProfileId: string;
	sourceDocumentId: string;
	receivedAt: string;
	grossAmount: string;
	withheldTaxAmount: string;
	payerName: string | null;
	notes: string | null;
};

export type UpdateTaxIncomeValues = Pick<
	UpdateTaxIncomeInput,
	"receivedAt" | "grossAmount" | "withheldTaxAmount" | "payerName" | "notes"
>;

export interface TaxIncomeRepositoryPort {
	lockTaxProfileForEvaluation(executor: DatabaseExecutor, taxProfileId: string): Promise<void>;
	findByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<TaxIncomeRecord | undefined>;
	insertManual(
		executor: DatabaseExecutor,
		values: InsertManualTaxIncome,
	): Promise<TaxIncomeRecord | undefined>;
	getOwnedForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
	): Promise<TaxIncomeRecord | undefined>;
	updateOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		values: UpdateTaxIncomeValues,
	): Promise<TaxIncomeRecord | undefined>;
	softDeleteOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		deletedAt: Date,
	): Promise<TaxIncomeRecord | undefined>;
	getOwned(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		recordId: string,
	): Promise<TaxIncomeRecord | undefined>;
	listVisible(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		query: { cursor?: TaxIncomeCursor; limit: number },
	): Promise<TaxIncomeRecord[]>;
	sumVisible(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<{ grossAmount: string; withheldTaxAmount: string; count: number }>;
	getDocumentForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<TaxIncomeSourceDocument | undefined>;
	findActiveBySourceDocument(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<TaxIncomeRecord | undefined>;
	insertDocumentIncome(
		executor: DatabaseExecutor,
		values: InsertDocumentTaxIncome,
	): Promise<TaxIncomeRecord | undefined>;
	resolveFourthIncomeAttention(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
		resolution: Record<string, unknown>,
	): Promise<void>;
	getDocumentCandidateSource(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		documentId: string,
	): Promise<FourthIncomeCandidateSource | undefined>;
}

export type PublicTaxIncomeRecord = Omit<
	TaxIncomeRecord,
	"taxProfileId" | "idempotencyKey" | "payerTaxId" | "exchangeRate"
>;
