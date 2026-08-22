import type { DocumentType } from "../../database/schema/schema.types";
import { isValidPeruRuc } from "./ruc";

export type RawExtraction = {
	issuerTaxId: string | null;
	issuerName: string | null;
	issueDate: string | null;
	documentType: string | null;
	documentNumber: string | null;
	currency: string | null;
	subtotalAmount: string | null;
	taxAmount: string | null;
	totalAmount: string | null;
	paymentDate: string | null;
	grossFeeAmount: string | null;
	incomeTaxWithheldAmount: string | null;
	netPaidAmount: string | null;
	payerName: string | null;
};

export type NormalizedExtraction = {
	issuerTaxId: string | null;
	issuerName: string | null;
	issueDate: string | null;
	documentType: DocumentType;
	documentNumber: string | null;
	currencyCode: "PEN" | "USD" | null;
	subtotalAmount: string | null;
	taxAmount: string | null;
	totalAmount: string | null;
	paymentDate: string | null;
	grossFeeAmount: string | null;
	incomeTaxWithheldAmount: string | null;
	netPaidAmount: string | null;
	payerName: string | null;
};

export type DoubtfulField = "issuerTaxId" | "issueDate" | "totalAmount" | "documentType";

export type ExtractionDecision = {
	status: "ready" | "needs_review" | "failed";
	doubtfulFields: DoubtfulField[];
	fieldConfidence: {
		issuerTaxId: null;
		issueDate: null;
		totalAmount: null;
		documentType: null;
	};
};

const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
	boleta: "receipt",
	factura: "invoice",
	recibo_por_honorarios: "fee_receipt",
	boleta_de_pago: "payroll_slip",
	otro: "other",
};

function trimOrNull(value: string | null): string | null {
	if (value === null) {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeDocumentType(value: string | null): DocumentType {
	if (value === null) {
		return "unknown";
	}
	return DOCUMENT_TYPE_MAP[value.trim().toLowerCase()] ?? "unknown";
}

function normalizeCurrencyCode(value: string | null): "PEN" | "USD" | null {
	if (value === null) {
		return null;
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}
	const upper = trimmed.toUpperCase();
	if (trimmed === "S/" || upper === "PEN") {
		return "PEN";
	}
	if (trimmed === "$" || trimmed === "US$" || upper === "USD") {
		return "USD";
	}
	return null;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
	if (month < 1 || month > 12 || day < 1) {
		return false;
	}
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return day <= daysInMonth;
}

function formatDateParts(year: number, month: number, day: number): string {
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIssueDate(value: string | null): string | null {
	const trimmed = trimOrNull(value);
	if (trimmed === null) {
		return null;
	}

	const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
	if (isoMatch) {
		const year = Number(isoMatch[1]);
		const month = Number(isoMatch[2]);
		const day = Number(isoMatch[3]);
		return isValidCalendarDate(year, month, day) ? formatDateParts(year, month, day) : null;
	}

	const dmyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
	if (dmyMatch) {
		const day = Number(dmyMatch[1]);
		const month = Number(dmyMatch[2]);
		const year = Number(dmyMatch[3]);
		return isValidCalendarDate(year, month, day) ? formatDateParts(year, month, day) : null;
	}

	return null;
}

function normalizeIssuerTaxId(value: string | null): string | null {
	const trimmed = trimOrNull(value);
	if (trimmed === null) {
		return null;
	}
	return isValidPeruRuc(trimmed) ? trimmed : null;
}

export function normalizeExtraction(raw: RawExtraction): NormalizedExtraction {
	return {
		issuerTaxId: normalizeIssuerTaxId(raw.issuerTaxId),
		issuerName: trimOrNull(raw.issuerName),
		issueDate: parseIssueDate(raw.issueDate),
		documentType: normalizeDocumentType(raw.documentType),
		documentNumber: trimOrNull(raw.documentNumber),
		currencyCode: normalizeCurrencyCode(raw.currency),
		subtotalAmount: trimOrNull(raw.subtotalAmount),
		taxAmount: trimOrNull(raw.taxAmount),
		totalAmount: trimOrNull(raw.totalAmount),
		paymentDate: parseIssueDate(raw.paymentDate),
		grossFeeAmount: trimOrNull(raw.grossFeeAmount),
		incomeTaxWithheldAmount: trimOrNull(raw.incomeTaxWithheldAmount),
		netPaidAmount: trimOrNull(raw.netPaidAmount),
		payerName: trimOrNull(raw.payerName),
	};
}

function hasUsableValue(value: string | null): boolean {
	return value !== null;
}

function emptyFieldConfidence(): ExtractionDecision["fieldConfidence"] {
	return {
		issuerTaxId: null,
		issueDate: null,
		totalAmount: null,
		documentType: null,
	};
}

export function validateExtraction(normalized: NormalizedExtraction): ExtractionDecision {
	const fieldConfidence = emptyFieldConfidence();
	const doubtfulFields: DoubtfulField[] = [];

	const hasCriticalOrSupportingData =
		hasUsableValue(normalized.issuerTaxId) ||
		hasUsableValue(normalized.issueDate) ||
		hasUsableValue(normalized.totalAmount) ||
		normalized.documentType !== "unknown" ||
		hasUsableValue(normalized.issuerName);

	if (!hasCriticalOrSupportingData) {
		return {
			status: "failed",
			doubtfulFields,
			fieldConfidence,
		};
	}

	if (!hasUsableValue(normalized.issuerTaxId)) {
		doubtfulFields.push("issuerTaxId");
	}
	if (!hasUsableValue(normalized.issueDate)) {
		doubtfulFields.push("issueDate");
	}
	if (!hasUsableValue(normalized.totalAmount)) {
		doubtfulFields.push("totalAmount");
	}
	if (normalized.documentType === "unknown") {
		doubtfulFields.push("documentType");
	}

	return {
		status: doubtfulFields.length === 0 ? "ready" : "needs_review",
		doubtfulFields,
		fieldConfidence,
	};
}
