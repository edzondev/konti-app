import type { DatabaseExecutor } from "../../database/database.types";
import type {
	DeductionCalculationStatus,
	DeductionRequirement,
	DeductionVerificationStatus,
	FourthServiceActivityType,
	MedicalDeductionBeneficiary,
	RentAttribution,
	TaxDeductionCategory,
	TaxDeductionRecord,
} from "./tax-deduction.types";
import type { TaxDeductionCandidateSource } from "./tax-deduction-candidate";

export const TAX_DEDUCTION_REPOSITORY = Symbol("TAX_DEDUCTION_REPOSITORY");

export type StoredTaxDeductionRecord = TaxDeductionRecord & {
	readonly taxProfileId: string;
	readonly sourceDocumentId: string | null;
	readonly source: "manual" | "document" | "integration";
	readonly idempotencyKey: string | null;
	readonly eligibleBasePen: string;
	readonly notes: string | null;
	readonly deletedAt: Date | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
};

export type TaxDeductionSourceDocument = {
	id: string;
	taxProfileId: string;
	status: string;
	documentType: string;
	currencyCode: string | null;
};

export type InsertTaxDeductionValues = {
	taxProfileId: string;
	sourceDocumentId: string | null;
	source: "manual" | "document";
	idempotencyKey: string | null;
	input: CanonicalTaxDeductionInput;
	eligibleBase: string;
	attentionReasons: readonly string[];
};

export type CanonicalTaxDeductionInput = {
	category: TaxDeductionCategory;
	expenseDate: string;
	grossAmount: string;
	verificationStatus: DeductionVerificationStatus;
	calculationStatus: DeductionCalculationStatus;
	requirements: readonly DeductionRequirement[];
	notes: string | null;
	beneficiary: MedicalDeductionBeneficiary | null;
	insuranceReimbursementAmount: string | null;
	fourthActivityType: FourthServiceActivityType | null;
	attribution: RentAttribution | null;
};

export interface TaxDeductionRepositoryPort {
	lockTaxProfile(executor: DatabaseExecutor, taxProfileId: string): Promise<void>;
	findByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxDeductionRecord | undefined>;
	findActiveBySourceDocument(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<StoredTaxDeductionRecord | undefined>;
	getDocumentForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<TaxDeductionSourceDocument | undefined>;
	insert(
		executor: DatabaseExecutor,
		values: InsertTaxDeductionValues,
	): Promise<StoredTaxDeductionRecord | undefined>;
	getOwned(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		recordId: string,
		forUpdate?: boolean,
	): Promise<StoredTaxDeductionRecord | undefined>;
	listVisible(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
	): Promise<StoredTaxDeductionRecord[]>;
	updateOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		input: CanonicalTaxDeductionInput,
		eligibleBase: string,
		attentionReasons: readonly string[],
	): Promise<StoredTaxDeductionRecord | undefined>;
	softDeleteOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		deletedAt: Date,
	): Promise<StoredTaxDeductionRecord | undefined>;
	syncAttention(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		documentId: string | null,
		reasons: readonly string[],
	): Promise<void>;
	storeDniIdentity(
		executor: DatabaseExecutor,
		taxProfileId: string,
		blindIndex: string,
		last4: string,
	): Promise<void>;
	getDniIdentityLast4(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
	): Promise<string | null>;
	getDocumentCandidateSource(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		documentId: string,
	): Promise<TaxDeductionCandidateSource | undefined>;
}
