import type { DatabaseExecutor } from "../../database/database.types";
import type {
	ActivityClassificationSource,
	CalculationDisposition,
	CoverageScope,
	TaxIncomeRecordKind,
	TaxIncomeType,
} from "../../database/schema/schema.types";
import type { TaxIncomeCursor } from "./tax-income.cursor";
import type {
	CreateEmploymentTaxIncomeInput,
	CreateFourthTaxIncomeInput,
	EmploymentCoverageResolutionInput,
	UpdateTaxIncomeInput,
} from "./tax-income.validation";
import type { FourthIncomeCandidateSource } from "./tax-income-candidate";

export const TAX_INCOME_REPOSITORY = Symbol("TAX_INCOME_REPOSITORY");

export type FourthIncomeType = Exclude<TaxIncomeType, "employment">;

export type TaxIncomeRecord = {
	id: string;
	taxProfileId: string;
	sourceDocumentId: string | null;
	incomeType: TaxIncomeType;
	activityClassificationSource: ActivityClassificationSource | null;
	source: "manual" | "document";
	idempotencyKey: string | null;
	receivedAt: string | null;
	recordKind?: TaxIncomeRecordKind;
	coverageStart?: string | null;
	coverageEnd?: string | null;
	coverageScope?: CoverageScope | null;
	calculationDisposition?: CalculationDisposition;
	coveredByRecordId?: string | null;
	coverageResolutionReason?: string | null;
	grossAmount: string;
	withheldTaxAmount: string;
	currencyCode: "PEN";
	exchangeRate: null;
	grossAmountPen: string;
	withheldTaxAmountPen: string;
	payerName: string | null;
	payerTaxId: string | null;
	status: "confirmed";
	notes: string | null;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type InsertManualTaxIncome =
	| ({
			taxProfileId: string;
	  } & CreateFourthTaxIncomeInput)
	| ({
			taxProfileId: string;
	  } & CreateEmploymentTaxIncomeInput);

export type LegacyInsertManualTaxIncome = {
	taxProfileId: string;
	activityType: FourthIncomeType;
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

export type InsertDocumentTaxIncome =
	| {
			taxProfileId: string;
			sourceDocumentId: string;
			activityType: FourthIncomeType;
			receivedAt: string;
			grossAmount: string;
			withheldTaxAmount: string;
			payerName: string | null;
			notes: string | null;
	  }
	| {
			taxProfileId: string;
			sourceDocumentId: string;
			incomeType: "employment";
			recordKind: "period" | "year_to_date_snapshot";
			coverageStart: string;
			coverageEnd: string;
			coverageScope: "single_payer" | "all_employers";
			grossAmount: string;
			withheldTaxAmount: string;
			payerName: string | null;
			payerTaxId: string | null;
			notes: string | null;
	  };

export type UpdateTaxIncomeValues = UpdateTaxIncomeInput;

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
		query: { cursor?: TaxIncomeCursor; limit: number; type?: "all" | "employment" | "fourth" },
	): Promise<TaxIncomeRecord[]>;
	sumVisible(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<{
		grossAmount: string;
		withheldTaxAmount: string;
		count: number;
		fourthGrossAmount: string;
		employmentGrossAmount: string;
		withheldFourth: string;
		withheldFifth: string;
		fourthCount: number;
		employmentCount: number;
	}>;
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
	keepFourthIncomeAttentionOpen(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
		decision: "unpaid" | "unsure" | "activity_unsure",
	): Promise<void>;
	getDocumentCandidateSource(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		documentId: string,
	): Promise<FourthIncomeCandidateSource | undefined>;
	recalculateEmploymentCoverage(executor: DatabaseExecutor, taxProfileId: string): Promise<void>;
	resolveEmploymentCoverageConflict(
		executor: DatabaseExecutor,
		taxProfileId: string,
		current: TaxIncomeRecord,
		decision: EmploymentCoverageResolutionInput["decision"],
	): Promise<TaxIncomeRecord | undefined>;
}

export type PublicTaxIncomeRecord = Omit<
	TaxIncomeRecord,
	"taxProfileId" | "idempotencyKey" | "exchangeRate"
>;
