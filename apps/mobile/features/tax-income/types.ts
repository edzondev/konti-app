import type { CurrentTaxStatus } from "../tax-status/types";
import type { TaxIncomeFormValues } from "./tax-income.validation";

export interface TaxIncomeRecord {
	id: string;
	sourceDocumentId: string | null;
	incomeType: "independent_services";
	source: "manual" | "document";
	receivedAt: string;
	grossAmount: string;
	withheldTaxAmount: string;
	currencyCode: "PEN";
	grossAmountPen: string;
	withheldTaxAmountPen: string;
	payerName: string | null;
	status: "confirmed";
	notes: string | null;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface TaxIncomePage {
	items: TaxIncomeRecord[];
	nextCursor: string | null;
	summary: { grossAmount: string; withheldTaxAmount: string; count: number };
}

export type CreateTaxIncomeInput = TaxIncomeFormValues & { idempotencyKey: string };
export type UpdateTaxIncomeInput = Partial<TaxIncomeFormValues>;

export type ConfirmDocumentIncomeInput = TaxIncomeFormValues & {
	documentId: string;
	decision: "confirmed";
};

export type DocumentDecisionInput =
	| ConfirmDocumentIncomeInput
	| { documentId: string; decision: "not_mine" };

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
