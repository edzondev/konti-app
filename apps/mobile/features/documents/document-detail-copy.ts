import type { DocumentDetail, DocumentType, DoubtfulField } from "./types";

const EMPTY = "—";

const PEN_AMOUNT_FORMATTER = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
});

const USD_AMOUNT_FORMATTER = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "USD",
});

const ISSUE_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: "America/Lima",
	day: "numeric",
	month: "short",
	year: "numeric",
});

const DOCUMENT_TYPE_LABELS: Partial<Record<DocumentType, string>> = {
	receipt: "Boleta",
	invoice: "Factura",
	fee_receipt: "Recibo",
	payroll_slip: "Boleta de pago",
};

export type DetailFieldRow = {
	label: string;
	value: string;
	doubtful: boolean;
};

function textOrDash(value: string | null | undefined): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : EMPTY;
}

function formatIssueDate(value: string | null | undefined): string {
	if (!value) {
		return EMPTY;
	}

	const [yearText, monthText, dayText] = value.split("-");
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
		return EMPTY;
	}

	return ISSUE_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day, 17, 0, 0)));
}

function formatAmount(
	value: string | null | undefined,
	currencyCode: "PEN" | "USD" | null | undefined,
): string {
	if (!value) {
		return EMPTY;
	}

	const amount = Number.parseFloat(value);
	if (!Number.isFinite(amount)) {
		return EMPTY;
	}

	const formatter = currencyCode === "USD" ? USD_AMOUNT_FORMATTER : PEN_AMOUNT_FORMATTER;
	return formatter.format(amount);
}

function isDoubtful(fields: DoubtfulField[] | undefined, field: DoubtfulField): boolean {
	return fields?.includes(field) === true;
}

export function detailFieldRows(document: DocumentDetail["document"]): DetailFieldRow[] {
	const doubtfulFields = document.doubtfulFields;

	return [
		{
			label: "RUC",
			value: textOrDash(document.issuerTaxId),
			doubtful: isDoubtful(doubtfulFields, "issuerTaxId"),
		},
		{
			label: "Razón social",
			value: textOrDash(document.issuerName),
			doubtful: false,
		},
		{
			label: "Tipo",
			value: textOrDash(
				document.documentType ? DOCUMENT_TYPE_LABELS[document.documentType] : undefined,
			),
			doubtful: isDoubtful(doubtfulFields, "documentType"),
		},
		{
			label: "Serie/número",
			value: textOrDash(document.documentNumber),
			doubtful: false,
		},
		{
			label: "Fecha",
			value: formatIssueDate(document.issueDate),
			doubtful: isDoubtful(doubtfulFields, "issueDate"),
		},
		{
			label: "Moneda",
			value: textOrDash(document.currencyCode),
			doubtful: false,
		},
		{
			label: "Subtotal",
			value: formatAmount(document.subtotalAmount, document.currencyCode),
			doubtful: false,
		},
		{
			label: "IGV",
			value: formatAmount(document.taxAmount, document.currencyCode),
			doubtful: false,
		},
		{
			label: "Total",
			value: formatAmount(document.totalAmount, document.currencyCode),
			doubtful: isDoubtful(doubtfulFields, "totalAmount"),
		},
	];
}
