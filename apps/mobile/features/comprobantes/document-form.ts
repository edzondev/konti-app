import type { Document } from "./comprobantes-document";

export const CATEGORY_LABELS: Record<Document["category"], string> = {
	restaurantes: "Restaurantes",
	supermercado: "Supermercado",
	transporte: "Transporte",
	servicios_medicos: "Servicios médicos",
	servicios_profesionales: "Servicios profesionales",
	hogar_servicios: "Hogar y servicios",
	entretenimiento: "Entretenimiento",
	educacion: "Educación",
	otros: "Otros",
};

export const DOCUMENT_TYPE_LABELS: Record<Document["documentType"], string> = {
	boleta: "Boleta",
	factura: "Factura",
	recibo_honorarios: "Recibo por honorarios",
	ticket: "Ticket",
	unknown: "Sin completar",
};

export type DocumentEditDraft = {
	issuerName: string;
	issuerTaxId: string;
	issueDate: string;
	documentType: Document["documentType"];
	documentNumber: string;
	totalAmount: string;
	igvAmount: string;
};

export type DraftErrors = {
	issuerTaxId?: "RUC inválido";
	issueDate?: "Fecha inválida";
	totalAmount?: "Monto inválido";
	igvAmount?: "Monto inválido";
};

export type DocumentUpdatePayload = {
	issuerName?: string | null;
	issuerTaxId?: string | null;
	issueDate?: string | null;
	documentNumber?: string | null;
	documentType?: Document["documentType"];
	totalAmount?: string | null;
	igvAmount?: string | null;
};

const RUC_PATTERN = /^(10|15|17|20)\d{9}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function isoToDisplayDate(isoDate: string): string {
	const [year, month, day] = isoDate.split("-");
	return `${day}/${month}/${year}`;
}

function displayDateToIso(displayDate: string): string | null {
	const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (!match) {
		return null;
	}

	const [, dayText, monthText, yearText] = match;
	const day = Number(dayText);
	const month = Number(monthText);
	const year = Number(yearText);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return `${yearText}-${monthText}-${dayText}`;
}

function normalizeAmount(value: string): string {
	return value.trim().replace(",", ".");
}

function draftTextValue(value: string): string | null {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function originalTextValue(value: string | null): string | null {
	return value?.trim() ? value.trim() : null;
}

export function toEditDraft(document: Document): DocumentEditDraft {
	return {
		issuerName: document.issuerName ?? "",
		issuerTaxId: document.issuerTaxId ?? "",
		issueDate: document.issueDate ? isoToDisplayDate(document.issueDate) : "",
		documentType: document.documentType,
		documentNumber: document.documentNumber ?? "",
		totalAmount: document.totalAmount ?? "",
		igvAmount: document.igvAmount ?? "",
	};
}

export function validateDraft(draft: DocumentEditDraft): DraftErrors {
	const errors: DraftErrors = {};

	if (draft.issuerTaxId.trim() && !RUC_PATTERN.test(draft.issuerTaxId.trim())) {
		errors.issuerTaxId = "RUC inválido";
	}

	if (draft.issueDate.trim() && !displayDateToIso(draft.issueDate.trim())) {
		errors.issueDate = "Fecha inválida";
	}

	if (draft.totalAmount.trim() && !AMOUNT_PATTERN.test(normalizeAmount(draft.totalAmount))) {
		errors.totalAmount = "Monto inválido";
	}

	if (draft.igvAmount.trim() && !AMOUNT_PATTERN.test(normalizeAmount(draft.igvAmount))) {
		errors.igvAmount = "Monto inválido";
	}

	return errors;
}

export function toUpdatePayload(
	original: Document,
	draft: DocumentEditDraft,
): DocumentUpdatePayload | null {
	const payload: DocumentUpdatePayload = {};

	const draftIssuerName = draftTextValue(draft.issuerName);
	const originalIssuerName = originalTextValue(original.issuerName);
	if (draftIssuerName !== originalIssuerName) {
		payload.issuerName = draftIssuerName;
	}

	const draftIssuerTaxId = draftTextValue(draft.issuerTaxId);
	const originalIssuerTaxId = originalTextValue(original.issuerTaxId);
	if (draftIssuerTaxId !== originalIssuerTaxId) {
		payload.issuerTaxId = draftIssuerTaxId;
	}

	const draftIssueDate = draft.issueDate.trim() ? displayDateToIso(draft.issueDate.trim()) : null;
	if (draftIssueDate !== original.issueDate) {
		payload.issueDate = draftIssueDate;
	}

	const draftDocumentNumber = draftTextValue(draft.documentNumber);
	const originalDocumentNumber = originalTextValue(original.documentNumber);
	if (draftDocumentNumber !== originalDocumentNumber) {
		payload.documentNumber = draftDocumentNumber;
	}

	if (draft.documentType !== original.documentType) {
		payload.documentType = draft.documentType;
	}

	const draftTotalAmount = draftTextValue(normalizeAmount(draft.totalAmount));
	const originalTotalAmount = originalTextValue(original.totalAmount);
	if (draftTotalAmount !== originalTotalAmount) {
		payload.totalAmount = draftTotalAmount;
	}

	const draftIgvAmount = draftTextValue(normalizeAmount(draft.igvAmount));
	const originalIgvAmount = originalTextValue(original.igvAmount);
	if (draftIgvAmount !== originalIgvAmount) {
		payload.igvAmount = draftIgvAmount;
	}

	return Object.keys(payload).length > 0 ? payload : null;
}
