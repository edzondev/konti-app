import { clampDateOnly, todayDateOnlyInLima } from "@/shared/date-only";

import type { FourthActivityType, TaxIncomeFormInput } from "./tax-income.validation";

export type TaxIncomePrefill = {
	activityType?: FourthActivityType | null;
	paymentDate?: string | null;
	issueDate?: string | null;
	dueDate?: string | null;
	documentReportedPaymentDate?: string | null;
	grossAmount?: string | null;
	withheldTaxAmount?: string | null;
	payerName?: string | null;
	notes?: string | null;
};

type TaxIncomeFormDefaultsOptions = {
	defaultPaymentDate?: "today";
	now?: Date;
};

type TaxIncomeFormPendingInput = {
	isCreatePending: boolean;
	isUpdatePending: boolean;
	isDocumentDecisionPending: boolean;
	isDeletePending: boolean;
};

export function taxIncomeFormPendingState({
	isCreatePending,
	isUpdatePending,
	isDocumentDecisionPending,
	isDeletePending,
}: TaxIncomeFormPendingInput) {
	const isSaving = isCreatePending || isUpdatePending || isDocumentDecisionPending;

	return {
		isAnyPending: isSaving || isDeletePending,
		isSaving,
		isDeleting: isDeletePending,
	};
}

export function taxIncomeFormDefaults(
	prefill: TaxIncomePrefill = {},
	options: TaxIncomeFormDefaultsOptions = {},
): TaxIncomeFormInput {
	return {
		activityType: prefill.activityType ?? "",
		receivedAt:
			prefill.paymentDate ??
			(options.defaultPaymentDate === "today" ? currentPaymentDate(options.now) : ""),
		grossAmount: prefill.grossAmount ?? "",
		withheldTaxAmount: prefill.withheldTaxAmount ?? "",
		payerName: prefill.payerName ?? "",
		notes: prefill.notes ?? "",
	};
}

function currentPaymentDate(now = new Date()): string {
	return clampDateOnly(todayDateOnlyInLima(now), "2026-01-01", "2026-12-31");
}
