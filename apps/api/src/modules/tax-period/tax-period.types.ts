import type { DatabaseExecutor } from "../../database/database.types";
import type {
	MonthlyFactState,
	MonthlyFourthActivityClassification,
	MonthlyFourthCoverage,
	SuspensionRestartState,
	TaxFactVerificationScope,
	TaxPeriodFactSource,
} from "../../database/schema/schema.types";
import type {
	MonthlyFourthIncome,
	MonthlyFourthInput,
	MonthlyFourthResult,
} from "../monthly-fourth/monthly-fourth.types";
import type {
	CreateTaxFilingInput,
	CreateTaxPaymentInput,
	CreateTaxSuspensionInput,
} from "./tax-period.validation";

export const TAX_PERIOD_REPOSITORY = Symbol("TAX_PERIOD_REPOSITORY");

type StoredBase = {
	id: string;
	taxProfileId: string;
	period: string;
	idempotencyKey: string;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type StoredTaxPeriodReview = StoredBase & {
	coverage: MonthlyFourthCoverage;
	activityClassification: MonthlyFourthActivityClassification;
	reviewedAt?: Date;
};

type StoredFactBase = StoredBase & {
	answer: MonthlyFactState;
	verificationScope: TaxFactVerificationScope;
	source: TaxPeriodFactSource;
	sourceDocumentId: string | null;
};

export type StoredTaxSuspension = StoredFactBase & {
	authorizationDate: string | null;
	effectiveFrom: string | null;
	validThrough: string | null;
	restartState: SuspensionRestartState;
	restartDate: string | null;
};

export type StoredTaxFiling = StoredFactBase & {
	formType?: "virtual_616";
	filedAt: string | null;
	confirmationNumber: string | null;
};

export type StoredTaxPayment = StoredFactBase & {
	amountPen: string | null;
	paidAt: string | null;
	confirmationCode: string | null;
};

export type MonthlyPeriodData = {
	review: StoredTaxPeriodReview | null;
	suspension: StoredTaxSuspension | null;
	filing: StoredTaxFiling | null;
	payment: StoredTaxPayment | null;
	fourthIncomes: readonly MonthlyFourthIncome[];
	fifthGrossAmountPen: string;
	pendingDocumentCount: number;
};

export type MonthlyRecordedFactResponse = {
	state: MonthlyFactState;
	verificationScope: TaxFactVerificationScope | null;
	recordedAt: string | null;
	amountPen: string | null;
	confirmationCode: string | null;
};

export type MonthlySuspensionResponse = {
	state: MonthlyFactState;
	verificationScope: TaxFactVerificationScope | null;
	authorizationDate: string | null;
	effectiveFrom: string | null;
	validThrough: string | null;
	restartState: SuspensionRestartState;
	restartDate: string | null;
};

export type MonthlyFourthPeriod = Omit<
	MonthlyFourthResult,
	"filing" | "payment" | "activityClassification"
> & {
	activityClassification: MonthlyFourthActivityClassification;
	coverage: MonthlyFourthCoverage;
	suspensionValidThrough: string | null;
	filing: MonthlyRecordedFactResponse | null;
	payment: MonthlyRecordedFactResponse | null;
	suspension: MonthlySuspensionResponse | null;
};

export type ReplaceTaxPeriodReview = {
	taxProfileId: string;
	period: string;
	coverage: MonthlyFourthCoverage;
	activityClassification: MonthlyFourthActivityClassification;
	idempotencyKey: string;
};

export type ReplaceTaxSuspension = {
	taxProfileId: string;
	input: CreateTaxSuspensionInput;
	effectiveFrom: string | null;
	validThrough: string | null;
	source: TaxPeriodFactSource;
};

export type ReplaceTaxFiling = {
	taxProfileId: string;
	input: CreateTaxFilingInput;
	source: TaxPeriodFactSource;
};

export type ReplaceTaxPayment = {
	taxProfileId: string;
	input: CreateTaxPaymentInput;
	source: TaxPeriodFactSource;
};

export type InsertPeriodEvaluation = {
	taxProfileId: string;
	period: string;
	rulesetVersion: "pe-2026.2.0";
	triggeredBy:
		| "tax_period_reviewed"
		| "tax_suspension_recorded"
		| "tax_filing_recorded"
		| "tax_payment_recorded";
	inputSnapshot: MonthlyFourthInput;
	outputSnapshot: MonthlyFourthResult;
	supersedesId: string | null;
};

export type PeriodEvaluationReference = { id: string };

export interface TaxPeriodRepositoryPort {
	lockTaxProfile(executor: DatabaseExecutor, taxProfileId: string): Promise<void>;
	getOwnedDocumentForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<{ id: string } | undefined>;
	findPeriodReviewByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxPeriodReview | undefined>;
	findSuspensionByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxSuspension | undefined>;
	findFilingByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxFiling | undefined>;
	findPaymentByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxPayment | undefined>;
	replacePeriodReview(
		executor: DatabaseExecutor,
		values: ReplaceTaxPeriodReview,
	): Promise<StoredTaxPeriodReview>;
	replaceSuspension(
		executor: DatabaseExecutor,
		values: ReplaceTaxSuspension,
	): Promise<StoredTaxSuspension>;
	replaceFiling(executor: DatabaseExecutor, values: ReplaceTaxFiling): Promise<StoredTaxFiling>;
	replacePayment(executor: DatabaseExecutor, values: ReplaceTaxPayment): Promise<StoredTaxPayment>;
	loadPeriodData(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		period: string,
	): Promise<MonthlyPeriodData>;
	findLatestPeriodEvaluation(
		executor: DatabaseExecutor,
		taxProfileId: string,
		period: string,
	): Promise<PeriodEvaluationReference | undefined>;
	insertPeriodEvaluation(
		executor: DatabaseExecutor,
		values: InsertPeriodEvaluation,
	): Promise<PeriodEvaluationReference>;
	syncMonthlyAttention(
		executor: DatabaseExecutor,
		values: {
			taxProfileId: string;
			period: string;
			taxEvaluationId: string;
			status: MonthlyFourthResult["status"];
			reasons: readonly string[];
			open: boolean;
		},
	): Promise<void>;
	countOutstandingPeriods(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<number>;
}
