import type { CurrentTaxStatus } from "../tax-status/types";
import type { EmploymentIncomeFormValues } from "./employment-form.validation";
import type { FourthActivityType, TaxIncomeFormValues } from "./tax-income.validation";

export type ActivityClassificationSource = "manual_confirmation" | "migrated_default" | "document";
export type TaxIncomeFilter = "all" | "employment" | "fourth";
export type TaxIncomeRecordKind = "payment" | "period" | "year_to_date_snapshot";
export type EmploymentCoverageScope = "single_payer" | "all_employers";
export type CalculationDisposition = "included" | "excluded_by_coverage" | "needs_resolution";

export interface TaxIncomeRecord {
	id: string;
	sourceDocumentId: string | null;
	incomeType: FourthActivityType | "employment";
	activityClassificationSource: ActivityClassificationSource | null;
	source: "manual" | "document";
	receivedAt: string | null;
	recordKind: TaxIncomeRecordKind;
	coverageStart: string | null;
	coverageEnd: string | null;
	coverageScope: EmploymentCoverageScope | null;
	grossAmount: string;
	withheldTaxAmount: string;
	currencyCode: "PEN";
	grossAmountPen: string;
	withheldTaxAmountPen: string;
	payerName: string | null;
	payerTaxId: string | null;
	calculationDisposition: CalculationDisposition;
	coveredByRecordId: string | null;
	coverageResolutionReason: string | null;
	status: "confirmed" | "pending_sync";
	notes: string | null;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface TaxIncomePage {
	items: TaxIncomeRecord[];
	nextCursor: string | null;
	summary: {
		grossAmount: string;
		withheldTaxAmount: string;
		count: number;
		fourthGrossAmount?: string;
		employmentGrossAmount?: string;
		withheldFourth?: string;
		withheldFifth?: string;
		fourthCount?: number;
		employmentCount?: number;
	};
}

export type CreateFourthTaxIncomeInput = TaxIncomeFormValues & { idempotencyKey: string };
export type CreateEmploymentTaxIncomeInput = EmploymentIncomeFormValues & {
	incomeType: "employment";
	idempotencyKey: string;
};
export type CreateTaxIncomeInput = CreateFourthTaxIncomeInput | CreateEmploymentTaxIncomeInput;
export type UpdateTaxIncomeInput =
	| Partial<TaxIncomeFormValues>
	| (Partial<EmploymentIncomeFormValues> & { incomeType: "employment" });

export type ConfirmDocumentIncomeInput = TaxIncomeFormValues & {
	documentId: string;
	decision: "paid";
};

export type ConfirmEmploymentDocumentInput = EmploymentIncomeFormValues & {
	documentId: string;
	decision: "employment_confirmed";
	incomeType: "employment";
};

export type DocumentDecisionInput =
	| ConfirmDocumentIncomeInput
	| ConfirmEmploymentDocumentInput
	| {
			documentId: string;
			decision: "unpaid" | "unsure" | "activity_unsure" | "not_mine";
	  };

export type EmploymentCoverageResolutionInput = {
	decision: "include_separately" | "exclude_as_covered";
};

export interface TaxIncomeMutationResult {
	record: TaxIncomeRecord;
	taxStatus: CurrentTaxStatus;
}

export interface DeleteTaxIncomeResult {
	record: { id: string; deletedAt: string };
	taxStatus: CurrentTaxStatus;
}

export interface DocumentDecisionResult {
	record: TaxIncomeRecord | null;
	taxStatus: CurrentTaxStatus;
}
