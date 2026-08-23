import type { TaxDeductionCategory } from "./tax-deduction.types";

export type TaxDeductionCandidateSource = {
	documentStatus: string;
	documentType: string;
	issueDate: string | null;
	currencyCode: string | null;
	hasActiveDeduction: boolean;
	consumerIdentityEvidence?: "matches" | "does_not_match" | "unknown";
	normalizedResult: Record<string, unknown>;
};

export type TaxDeductionCandidate = {
	categoryHint: TaxDeductionCategory;
	/** Fecha de emisión del comprobante; nunca se usa como fecha de pago. */
	issueDate: string;
	grossAmount: string;
	insuranceReimbursementAmount: string | null;
	serviceDescription: string | null;
	paymentMethodEvidence: string | null;
	propertyCountry: string | null;
	propertyUse: string | null;
	supportingFormNumber: string | null;
	workerRegistrationEvidence: string | null;
	attributionHint: "taxpayer" | "spouse_or_partner" | "unknown" | null;
	verificationStatus: "evidence_attached";
	calculationStatus: "potential";
	consumerIdentityEvidence: "matches" | "does_not_match" | "unknown";
	warnings: string[];
};

const CATEGORIES: readonly TaxDeductionCategory[] = [
	"restaurants_hotels",
	"medical_dental_services",
	"other_fourth_services",
	"rent",
	"household_worker_essalud",
];
const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

function nullableString(source: Record<string, unknown>, key: string) {
	return typeof source[key] === "string" && source[key].trim().length > 0
		? source[key].trim()
		: null;
}

export function deriveTaxDeductionCandidate(
	source: TaxDeductionCandidateSource,
): TaxDeductionCandidate | null {
	if (
		(source.documentStatus !== "ready" && source.documentStatus !== "needs_review") ||
		source.hasActiveDeduction ||
		source.currencyCode !== "PEN" ||
		!source.issueDate ||
		source.issueDate < "2026-01-01" ||
		source.issueDate > "2026-12-31"
	) {
		return null;
	}
	const category = nullableString(source.normalizedResult, "deductionCategoryHint");
	const amount =
		nullableString(source.normalizedResult, "amountPaid") ??
		nullableString(source.normalizedResult, "totalAmount");
	if (
		!category ||
		!CATEGORIES.includes(category as TaxDeductionCategory) ||
		!amount ||
		!MONEY.test(amount)
	) {
		return null;
	}
	const attribution = nullableString(source.normalizedResult, "attributionHint");
	return {
		categoryHint: category as TaxDeductionCategory,
		issueDate: source.issueDate,
		grossAmount: amount,
		insuranceReimbursementAmount: nullableString(
			source.normalizedResult,
			"insuranceReimbursementAmount",
		),
		serviceDescription: nullableString(source.normalizedResult, "serviceDescription"),
		paymentMethodEvidence: nullableString(source.normalizedResult, "paymentMethodEvidence"),
		propertyCountry: nullableString(source.normalizedResult, "propertyCountry"),
		propertyUse: nullableString(source.normalizedResult, "propertyUse"),
		supportingFormNumber: nullableString(source.normalizedResult, "supportingFormNumber"),
		workerRegistrationEvidence: nullableString(
			source.normalizedResult,
			"workerRegistrationEvidence",
		),
		attributionHint:
			attribution === "taxpayer" || attribution === "spouse_or_partner" || attribution === "unknown"
				? attribution
				: null,
		verificationStatus: "evidence_attached",
		calculationStatus: "potential",
		consumerIdentityEvidence: source.consumerIdentityEvidence ?? "unknown",
		warnings: [
			"Confirma los requisitos antes de incluir este gasto.",
			"Konti no verificó este comprobante contra SUNAT.",
		],
	};
}
