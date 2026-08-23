import type { DocumentStatus, DocumentType } from "../../database/schema/schema.types";

export type FourthIncomeCandidateWarning =
	| "document_not_ready"
	| "missing_gross_amount"
	| "missing_withholding_amount";

export type FourthIncomeCandidate = {
	eligibility: "eligible" | "insufficient_fields" | "unsupported_currency" | "already_decided";
	issueDate: string | null;
	paymentTerms: "cash" | "credit" | "unknown";
	dueDate: string | null;
	documentReportedPaymentDate: string | null;
	grossAmount: string | null;
	withheldTaxAmount: string | null;
	netPaidAmount: string | null;
	payerName: string | null;
	decision: FourthIncomeCandidateSource["decision"];
	warnings: FourthIncomeCandidateWarning[];
};

export type FourthIncomeCandidateSource = {
	documentType: DocumentType;
	status: DocumentStatus;
	issueDate: string | null;
	currencyCode: string | null;
	hasActiveIncome: boolean;
	decision: "paid" | "unpaid" | "unsure" | "activity_unsure" | "not_mine" | null;
	normalizedResult: Record<string, unknown>;
};

export function buildFourthIncomeAttention(input: {
	taxProfileId: string;
	documentId: string;
	documentType: DocumentType;
	currencyCode: string | null;
}) {
	if (input.documentType !== "fee_receipt" || input.currencyCode !== "PEN") return null;

	return {
		taxProfileId: input.taxProfileId,
		documentId: input.documentId,
		source: "document_processing" as const,
		itemType: "confirm_fourth_income",
		status: "open" as const,
		priority: "normal" as const,
		title: "Confirma si este RHE es un ingreso tuyo",
		message: "Revisa la fecha de cobro y los importes antes de registrarlo.",
		actionType: "confirm_fourth_income",
		actionPayload: { documentId: input.documentId },
		deduplicationKey: `fourth-income:${input.documentId}`,
	};
}

function stringOrNull(source: Record<string, unknown>, key: string): string | null {
	const value = source[key];
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveFourthIncomeCandidate(
	source: FourthIncomeCandidateSource,
): FourthIncomeCandidate | null {
	if (source.documentType !== "fee_receipt") return null;

	const rawPaymentTerms = stringOrNull(source.normalizedResult, "paymentTerms");
	const paymentTerms =
		rawPaymentTerms === "cash" || rawPaymentTerms === "credit" ? rawPaymentTerms : "unknown";
	const dueDate = stringOrNull(source.normalizedResult, "dueDate");
	const documentReportedPaymentDate = stringOrNull(source.normalizedResult, "actualPaymentDate");
	const grossAmount = stringOrNull(source.normalizedResult, "grossFeeAmount");
	const withheldTaxAmount = stringOrNull(source.normalizedResult, "incomeTaxWithheldAmount");
	const warnings: FourthIncomeCandidateWarning[] = [];
	if (source.status !== "ready" && source.status !== "needs_review") {
		warnings.push("document_not_ready");
	}
	if (!grossAmount) warnings.push("missing_gross_amount");
	if (!withheldTaxAmount) warnings.push("missing_withholding_amount");

	let eligibility: FourthIncomeCandidate["eligibility"];
	if (source.hasActiveIncome || source.decision === "paid" || source.decision === "not_mine") {
		eligibility = "already_decided";
	} else if (source.currencyCode !== "PEN") {
		eligibility = "unsupported_currency";
	} else if (warnings.length > 0) {
		eligibility = "insufficient_fields";
	} else {
		eligibility = "eligible";
	}

	return {
		eligibility,
		issueDate: source.issueDate,
		paymentTerms,
		dueDate,
		documentReportedPaymentDate,
		grossAmount,
		withheldTaxAmount,
		netPaidAmount: stringOrNull(source.normalizedResult, "netPaidAmount"),
		payerName: stringOrNull(source.normalizedResult, "payerName"),
		decision: source.decision,
		warnings,
	};
}
