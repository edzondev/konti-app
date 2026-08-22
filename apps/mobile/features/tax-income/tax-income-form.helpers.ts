import type { TaxIncomeFormInput } from "./tax-income.validation";

export type TaxIncomePrefill = {
	paymentDate?: string | null;
	issueDate?: string | null;
	grossAmount?: string | null;
	withheldTaxAmount?: string | null;
	payerName?: string | null;
	notes?: string | null;
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

export function taxIncomeFormDefaults(prefill: TaxIncomePrefill = {}): TaxIncomeFormInput {
	return {
		receivedAt: prefill.paymentDate ?? "",
		grossAmount: prefill.grossAmount ?? "",
		withheldTaxAmount: prefill.withheldTaxAmount ?? "",
		payerName: prefill.payerName ?? "",
		notes: prefill.notes ?? "",
	};
}

export function dateStringToPickerDate(value: string): Date {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return new Date(2026, 0, 1, 12);
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

export function pickerDateToDateString(value: Date): string {
	const year = String(value.getFullYear()).padStart(4, "0");
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function maximumPaymentDate(now = new Date()): Date {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const today = `${values.year}-${values.month}-${values.day}`;
	return dateStringToPickerDate(today < "2026-12-31" ? today : "2026-12-31");
}
