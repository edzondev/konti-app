import Decimal from "decimal.js";

export type EmploymentIncomeCandidateEligibility =
	| "eligible"
	| "insufficient_fields"
	| "unsupported_currency"
	| "already_decided";

export type EmploymentIncomeCandidateWarning =
	| "document_not_ready"
	| "missing_record_kind"
	| "missing_coverage_start"
	| "missing_coverage_end"
	| "missing_coverage_scope"
	| "missing_gross_amount"
	| "missing_withheld_tax_amount"
	| "missing_payer"
	| "invalid_coverage_start"
	| "invalid_coverage_end"
	| "invalid_coverage_range"
	| "invalid_coverage_combination"
	| "invalid_gross_amount"
	| "invalid_withheld_tax_amount"
	| "invalid_payer_tax_id";

export type EmploymentIncomeCandidateSource = {
	readonly documentType: string;
	readonly status: string;
	readonly currencyCode: string | null;
	readonly hasActiveIncome: boolean;
	readonly normalizedResult: Record<string, unknown>;
};

export type EmploymentIncomeCandidate = {
	readonly eligibility: EmploymentIncomeCandidateEligibility;
	readonly recordKind: "period" | "year_to_date_snapshot" | null;
	readonly coverageStart: string | null;
	readonly coverageEnd: string | null;
	readonly coverageScope: "single_payer" | "all_employers" | null;
	readonly grossAmount: string | null;
	readonly withheldTaxAmount: string | null;
	readonly payerName: string | null;
	readonly payerTaxId: string | null;
	readonly verificationScope: "unverified_ocr_evidence";
	readonly warnings: readonly EmploymentIncomeCandidateWarning[];
};

const supportedTypes = new Set(["payroll_slip", "withholding_certificate", "sunat_document"]);

function exactString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function exactEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
	return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
}

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

function isCalendarDateIn2026(value: string, now: Date): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
	return value >= "2026-01-01" && value <= "2026-12-31" && value <= today;
}

function isMoney(value: string | null, positive: boolean): boolean {
	if (!value || !MONEY_PATTERN.test(value)) return false;
	const amount = new Decimal(value);
	return positive ? amount.greaterThan(0) : amount.greaterThanOrEqualTo(0);
}

export function deriveEmploymentIncomeCandidate(
	source: EmploymentIncomeCandidateSource,
	now = new Date(),
): EmploymentIncomeCandidate | null {
	if (!supportedTypes.has(source.documentType)) return null;

	const normalized = source.normalizedResult;
	const recordKind = exactEnum(normalized.employmentRecordKind, [
		"period",
		"year_to_date_snapshot",
	] as const);
	const coverageStart = exactString(normalized.coverageStart);
	const coverageEnd = exactString(normalized.coverageEnd);
	const coverageScope = exactEnum(normalized.coverageScope, [
		"single_payer",
		"all_employers",
	] as const);
	const grossAmount = exactString(normalized.employmentGrossAmount);
	const withheldTaxAmount = exactString(normalized.employmentWithheldTaxAmount);
	const payerName = exactString(normalized.employerName);
	const payerTaxId = exactString(normalized.employerTaxId);
	const warnings: EmploymentIncomeCandidateWarning[] = [];
	if (source.status !== "ready" && source.status !== "needs_review") {
		warnings.push("document_not_ready");
	}
	if (!recordKind) warnings.push("missing_record_kind");
	if (!coverageStart) warnings.push("missing_coverage_start");
	if (!coverageEnd) warnings.push("missing_coverage_end");
	if (!coverageScope) warnings.push("missing_coverage_scope");
	if (!grossAmount) warnings.push("missing_gross_amount");
	if (!withheldTaxAmount) warnings.push("missing_withheld_tax_amount");
	if (coverageScope === "single_payer" && !payerName && !payerTaxId) warnings.push("missing_payer");
	if (coverageStart && !isCalendarDateIn2026(coverageStart, now)) {
		warnings.push("invalid_coverage_start");
	}
	if (coverageEnd && !isCalendarDateIn2026(coverageEnd, now)) {
		warnings.push("invalid_coverage_end");
	}
	if (coverageStart && coverageEnd && coverageStart > coverageEnd) {
		warnings.push("invalid_coverage_range");
	}
	if (recordKind === "period" && coverageScope === "all_employers") {
		warnings.push("invalid_coverage_combination");
	}
	if (grossAmount && !isMoney(grossAmount, true)) warnings.push("invalid_gross_amount");
	if (withheldTaxAmount && !isMoney(withheldTaxAmount, false)) {
		warnings.push("invalid_withheld_tax_amount");
	}
	if (
		grossAmount &&
		withheldTaxAmount &&
		isMoney(grossAmount, true) &&
		isMoney(withheldTaxAmount, false) &&
		new Decimal(withheldTaxAmount).greaterThan(grossAmount)
	) {
		warnings.push("invalid_withheld_tax_amount");
	}
	if (payerTaxId && !/^\d{11}$/.test(payerTaxId)) warnings.push("invalid_payer_tax_id");

	let eligibility: EmploymentIncomeCandidateEligibility =
		warnings.length === 0 ? "eligible" : "insufficient_fields";
	if (source.currencyCode !== "PEN") eligibility = "unsupported_currency";
	if (source.hasActiveIncome) eligibility = "already_decided";

	return {
		eligibility,
		recordKind,
		coverageStart,
		coverageEnd,
		coverageScope,
		grossAmount,
		withheldTaxAmount,
		payerName,
		payerTaxId,
		verificationScope: "unverified_ocr_evidence",
		warnings,
	};
}
