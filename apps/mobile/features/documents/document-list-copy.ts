import type { DocumentListItem, DoubtfulField, ListSubtitleTone } from "./types";

const LIMA_TIME_ZONE = "America/Lima";

const PEN_AMOUNT_FORMATTER = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
});

const USD_AMOUNT_FORMATTER = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "USD",
});

const SUBTITLE_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA_TIME_ZONE,
	day: "numeric",
	month: "short",
	year: "numeric",
});

const DOCUMENT_TYPE_LABELS: Partial<Record<NonNullable<DocumentListItem["documentType"]>, string>> =
	{
		receipt: "Boleta",
		invoice: "Factura",
		fee_receipt: "Recibo",
		payroll_slip: "Boleta de pago",
	};

const DOUBTFUL_FIELD_MESSAGES: Record<DoubtfulField, string> = {
	issuerTaxId: "Falta el RUC",
	issueDate: "Falta la fecha",
	totalAmount: "Falta el total",
	documentType: "Falta el tipo",
};

function sourceLabel(source: DocumentListItem["source"]): string {
	return source === "camera" ? "Cámara" : "Galería";
}

function issueDateToDate(value: string): Date {
	const [yearText, monthText, dayText] = value.split("-");
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
}

function subtitleDate(item: DocumentListItem): Date {
	if (item.issueDate) {
		return issueDateToDate(item.issueDate);
	}

	return new Date(item.createdAt);
}

function documentTypeLabel(documentType: DocumentListItem["documentType"]): string {
	if (!documentType) {
		return "";
	}

	return DOCUMENT_TYPE_LABELS[documentType] ?? "";
}

export function listTitle(item: DocumentListItem): string {
	return item.issuerName?.trim() || sourceLabel(item.source);
}

export function listAmount(item: DocumentListItem): string | null {
	if (!item.totalAmount) {
		return null;
	}

	const amount = Number.parseFloat(item.totalAmount);
	if (!Number.isFinite(amount)) {
		return null;
	}

	const formatter = item.currencyCode === "USD" ? USD_AMOUNT_FORMATTER : PEN_AMOUNT_FORMATTER;
	return formatter.format(amount);
}

export function listSubtitle(item: DocumentListItem): {
	text: string;
	tone: ListSubtitleTone;
} {
	switch (item.status) {
		case "uploaded":
			return { text: "Guardado", tone: "primary" };
		case "processing":
			return { text: "Leyendo tu comprobante", tone: "muted" };
		case "ready": {
			const tipo = documentTypeLabel(item.documentType);
			const fecha = SUBTITLE_DATE_FORMATTER.format(subtitleDate(item));
			return {
				text: tipo ? `${tipo} · ${fecha}` : fecha,
				tone: "muted",
			};
		}
		case "needs_review": {
			const field = item.doubtfulFields?.[0];
			return {
				text: field ? DOUBTFUL_FIELD_MESSAGES[field] : "",
				tone: "gold",
			};
		}
		case "failed":
			return { text: "No se pudo leer", tone: "muted" };
	}
}
