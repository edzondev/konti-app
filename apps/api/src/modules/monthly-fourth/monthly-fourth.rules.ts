import Decimal from "decimal.js";
import type {
	MonthlyFourthInput,
	MonthlyFourthReason,
	MonthlyFourthResult,
	MonthlyFourthStatus,
	MonthlyFourthSuspension,
	MonthlyFourthSuspensionEffect,
	MonthlyFourthThresholdKind,
	RecordedMonthlyFact,
	VerificationScope,
} from "./monthly-fourth.types";

const GENERAL_MONTHLY_THRESHOLD = new Decimal("4010.00");
const SPECIAL_MONTHLY_THRESHOLD = new Decimal("3208.00");
const ADVANCE_PAYMENT_RATE = new Decimal("0.08");
const ZERO = new Decimal(0);
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const PERIOD_PATTERN = /^2026-(?:0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^2026-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export class MonthlyFourthRulesInputError extends Error {
	readonly code = "MONTHLY_FOURTH_INPUT_INVALID" as const;

	constructor() {
		super("Monthly fourth-category input is invalid.");
		this.name = "MonthlyFourthRulesInputError";
	}
}

function parseMoney(value: string): Decimal {
	if (!MONEY_PATTERN.test(value)) throw new MonthlyFourthRulesInputError();
	return new Decimal(value);
}

function formatMoney(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function isCalendarDate(value: string): boolean {
	if (!DATE_PATTERN.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function nextCalendarDay(value: string): string {
	const parsed = new Date(`${value}T00:00:00.000Z`);
	parsed.setUTCDate(parsed.getUTCDate() + 1);
	return parsed.toISOString().slice(0, 10);
}

function periodEnd(period: string): string {
	const [year, month] = period.split("-").map(Number);
	return new Date(Date.UTC(year ?? 0, month ?? 0, 0)).toISOString().slice(0, 10);
}

function isVerificationScope(value: unknown): value is VerificationScope {
	return value === "user_provided" || value === "evidence_attached" || value === "system_verified";
}

function assertRecordedFact(fact: RecordedMonthlyFact | undefined): void {
	if (fact === undefined) return;
	if (fact.state === "unknown") return;
	if (
		(fact.state === "yes" || fact.state === "no") &&
		isVerificationScope(fact.verificationScope)
	) {
		return;
	}
	throw new MonthlyFourthRulesInputError();
}

function assertSuspension(suspension: MonthlyFourthSuspension): void {
	if (suspension.status === "unknown") return;
	if (suspension.status === "none") {
		if (!isVerificationScope(suspension.verificationScope)) {
			throw new MonthlyFourthRulesInputError();
		}
		return;
	}

	if (
		!isCalendarDate(suspension.authorizationDate) ||
		!isVerificationScope(suspension.verificationScope)
	) {
		throw new MonthlyFourthRulesInputError();
	}

	if (suspension.restart.status === "required") {
		const effectiveFrom = nextCalendarDay(suspension.authorizationDate);
		if (
			!isCalendarDate(suspension.restart.restartDate) ||
			suspension.restart.restartDate < effectiveFrom
		) {
			throw new MonthlyFourthRulesInputError();
		}
	}
}

function assertInput(input: MonthlyFourthInput): void {
	if (
		!PERIOD_PATTERN.test(input.period) ||
		(input.activityClassification !== "ordinary" &&
			input.activityClassification !== "special" &&
			input.activityClassification !== "unknown") ||
		(input.coverage !== "complete" &&
			input.coverage !== "partial" &&
			input.coverage !== "unknown") ||
		!Number.isInteger(input.pendingDocumentCount) ||
		input.pendingDocumentCount < 0
	) {
		throw new MonthlyFourthRulesInputError();
	}

	const fifthGross = parseMoney(input.fifthGrossAmountPen);
	if (fifthGross.isNegative()) throw new MonthlyFourthRulesInputError();

	for (const income of input.fourthIncomes) {
		if (
			income.id.length === 0 ||
			(income.activityType !== "fourth_ordinary" &&
				income.activityType !== "fourth_special" &&
				income.activityType !== "unknown") ||
			!isCalendarDate(income.receivedAt) ||
			!income.receivedAt.startsWith(`${input.period}-`)
		) {
			throw new MonthlyFourthRulesInputError();
		}

		const gross = parseMoney(income.grossAmountPen);
		const withholding = parseMoney(income.withheldTaxAmountPen);
		if (!gross.greaterThan(0) || withholding.isNegative() || withholding.greaterThan(gross)) {
			throw new MonthlyFourthRulesInputError();
		}
	}

	assertSuspension(input.suspension);
	assertRecordedFact(input.filing);
	assertRecordedFact(input.payment);
}

function cloneFact(fact: RecordedMonthlyFact | undefined): RecordedMonthlyFact | null {
	if (fact === undefined) return null;
	if (fact.state === "unknown") return Object.freeze({ state: "unknown" });
	return Object.freeze({ state: fact.state, verificationScope: fact.verificationScope });
}

function guidedStatus(input: MonthlyFourthInput): MonthlyFourthStatus {
	const requiredFacts = [input.filing, input.payment];
	if (requiredFacts.some((fact) => fact?.state === "no")) {
		return "action_likely_required";
	}
	if (requiredFacts.some((fact) => fact === undefined || fact.state === "unknown")) {
		return "awaiting_user_confirmation";
	}
	return "user_recorded_complete";
}

function suspensionWindow(input: MonthlyFourthInput): {
	effectiveFrom: string | null;
	effect: MonthlyFourthSuspensionEffect;
	isSuspendedAt: (date: string) => boolean;
} {
	const suspension = input.suspension;
	if (suspension.status === "unknown") {
		return {
			effectiveFrom: null,
			effect: "unknown",
			isSuspendedAt: () => false,
		};
	}
	if (suspension.status === "none") {
		return {
			effectiveFrom: null,
			effect: "none",
			isSuspendedAt: () => false,
		};
	}

	const effectiveFrom = nextCalendarDay(suspension.authorizationDate);
	const reviewedPeriodEnd = periodEnd(input.period);
	if (effectiveFrom > reviewedPeriodEnd) {
		return {
			effectiveFrom,
			effect: "future",
			isSuspendedAt: () => false,
		};
	}

	const restartDate =
		suspension.restart.status === "required" ? suspension.restart.restartDate : null;
	const isSuspendedAt = (date: string) =>
		date >= effectiveFrom && date <= "2026-12-31" && (restartDate === null || date < restartDate);
	const suspendedCount = input.fourthIncomes.filter((income) =>
		isSuspendedAt(income.receivedAt),
	).length;

	let effect: MonthlyFourthSuspensionEffect;
	if (suspendedCount === input.fourthIncomes.length && suspendedCount > 0) {
		effect = "active";
	} else if (suspendedCount > 0) {
		effect = "partial";
	} else if (restartDate !== null && restartDate <= reviewedPeriodEnd) {
		effect = "restarted";
	} else {
		effect = "active";
	}

	return { effectiveFrom, effect, isSuspendedAt };
}

function freezeResult(
	result: Omit<MonthlyFourthResult, "reasons"> & {
		reasons: MonthlyFourthReason[];
	},
): MonthlyFourthResult {
	return Object.freeze({ ...result, reasons: Object.freeze(result.reasons) });
}

export class MonthlyFourthRules {
	calculate(input: MonthlyFourthInput): MonthlyFourthResult {
		assertInput(input);

		let monthlyFourthGross = ZERO;
		let registeredFourthWithholding = ZERO;
		let hasSpecialActivity = input.activityClassification === "special";
		let hasUnknownActivity = input.activityClassification === "unknown";
		for (const income of input.fourthIncomes) {
			monthlyFourthGross = monthlyFourthGross.plus(income.grossAmountPen);
			registeredFourthWithholding = registeredFourthWithholding.plus(income.withheldTaxAmountPen);
			hasSpecialActivity ||= income.activityType === "fourth_special";
			hasUnknownActivity ||= income.activityType === "unknown";
		}

		const fifthGross = parseMoney(input.fifthGrossAmountPen);
		const combinedGross = monthlyFourthGross.plus(fifthGross);
		const activityClassification = hasUnknownActivity
			? ("unknown" as const)
			: hasSpecialActivity
				? ("special" as const)
				: ("ordinary" as const);
		const thresholdKind: MonthlyFourthThresholdKind | null = hasUnknownActivity
			? null
			: hasSpecialActivity
				? "special"
				: "general";
		const threshold =
			thresholdKind === null
				? null
				: thresholdKind === "special"
					? SPECIAL_MONTHLY_THRESHOLD
					: GENERAL_MONTHLY_THRESHOLD;
		const suspension = suspensionWindow(input);
		let unsuspendedFourthGross = ZERO;
		for (const income of input.fourthIncomes) {
			if (!suspension.isSuspendedAt(income.receivedAt)) {
				unsuspendedFourthGross = unsuspendedFourthGross.plus(income.grossAmountPen);
			}
		}

		const reasons: MonthlyFourthReason[] = [];
		if (hasUnknownActivity) reasons.push("activity_classification_unknown");
		if (input.coverage !== "complete") reasons.push("income_coverage_incomplete");
		if (input.pendingDocumentCount > 0) reasons.push("pending_documents");
		if (input.suspension.status === "unknown") reasons.push("suspension_unknown");
		const suspensionEffectiveFrom = suspension.effectiveFrom;
		if (
			input.suspension.status === "authorized" &&
			input.suspension.restart.status === "unknown" &&
			suspensionEffectiveFrom !== null &&
			input.fourthIncomes.some((income) => income.receivedAt >= suspensionEffectiveFrom)
		) {
			reasons.push("restart_conditions_unknown");
		}

		const common = {
			period: input.period,
			activityClassification,
			thresholdKind,
			monthlyThreshold: threshold === null ? null : formatMoney(threshold),
			monthlyFourthGross: formatMoney(monthlyFourthGross),
			monthlyFifthGross: formatMoney(fifthGross),
			monthlyCombinedGross: formatMoney(combinedGross),
			registeredFourthWithholding: formatMoney(registeredFourthWithholding),
			unsuspendedFourthGross: formatMoney(unsuspendedFourthGross),
			suspensionEffect: suspension.effect,
			suspensionEffectiveFrom: suspension.effectiveFrom,
			filing: cloneFact(input.filing),
			payment: cloneFact(input.payment),
			officialCompliance: "not_determined" as const,
		};

		if (reasons.length > 0) {
			return freezeResult({
				...common,
				status: "insufficient_data",
				estimatedAdvancePayment: null,
				requiresFilingReview: false,
				requiresPaymentReview: false,
				reasons,
			});
		}

		if (threshold === null) {
			throw new MonthlyFourthRulesInputError();
		}

		const thresholdExceeded = combinedGross.greaterThan(threshold);
		const estimatedAdvancePayment = Decimal.max(
			ZERO,
			unsuspendedFourthGross.times(ADVANCE_PAYMENT_RATE).minus(registeredFourthWithholding),
		);
		const actionLikely =
			monthlyFourthGross.greaterThan(0) &&
			thresholdExceeded &&
			unsuspendedFourthGross.greaterThan(0) &&
			estimatedAdvancePayment.greaterThan(0);

		if (!actionLikely) {
			if (monthlyFourthGross.isZero()) reasons.push("no_fourth_income");
			else if (!thresholdExceeded) reasons.push("below_monthly_threshold");
			else if (unsuspendedFourthGross.isZero()) reasons.push("valid_suspension");
			else reasons.push("withholding_covers_advance_payment");

			return freezeResult({
				...common,
				status: "no_action_detected",
				estimatedAdvancePayment: "0.00",
				requiresFilingReview: false,
				requiresPaymentReview: false,
				reasons,
			});
		}

		const status = guidedStatus(input);
		reasons.push("monthly_action_likely");
		if (status === "awaiting_user_confirmation") reasons.push("guided_facts_pending");
		if (status === "user_recorded_complete") reasons.push("guided_facts_recorded");

		return freezeResult({
			...common,
			status,
			estimatedAdvancePayment: formatMoney(estimatedAdvancePayment),
			requiresFilingReview: true,
			requiresPaymentReview: true,
			reasons,
		});
	}
}
