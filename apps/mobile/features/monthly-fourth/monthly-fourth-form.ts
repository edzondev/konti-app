import { normalizeMoney } from "@/features/tax-income/money";
import {
	type MonthlyFourthReviewValues,
	monthlyFourthReviewDefaults,
} from "./monthly-fourth.validation";
import type {
	MonthlyFourthMutationInput,
	MonthlyFourthPeriod,
	MonthlyFourthReviewInput,
	MonthlyReviewStepId,
} from "./types";

function textOrNull(value: string): string | null {
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

export function monthlyFourthMutationFromValues(
	step: MonthlyReviewStepId,
	values: MonthlyFourthReviewValues,
	period: string,
	idempotencyKey: string,
): MonthlyFourthMutationInput {
	const base = { period, idempotencyKey } as const;
	if (step === "coverage") {
		return { ...base, kind: "coverage", coverage: values.coverage };
	}
	if (step === "activity") {
		return {
			...base,
			kind: "activity",
			activityClassification: values.activityClassification,
		};
	}
	if (step === "suspension") {
		return {
			...base,
			kind: "suspension",
			answer: values.suspensionAnswer,
			authorizationDate:
				values.suspensionAnswer === "yes" ? textOrNull(values.suspensionAuthorizationDate) : null,
			restartState:
				values.suspensionAnswer === "yes"
					? values.restartAnswer
					: values.suspensionAnswer === "unknown"
						? "unknown"
						: "not_required",
			restartDate:
				values.suspensionAnswer === "yes" && values.restartAnswer === "required"
					? textOrNull(values.restartDate)
					: null,
		};
	}
	if (step === "filing") {
		return {
			...base,
			kind: "filing",
			answer: values.filingAnswer,
			filedAt: values.filingAnswer === "yes" ? textOrNull(values.filingDate) : null,
			confirmationNumber:
				values.filingAnswer === "yes" ? textOrNull(values.filingConfirmationNumber) : null,
		};
	}

	return {
		...base,
		kind: "payment",
		answer: values.paymentAnswer,
		amountPen: values.paymentAnswer === "yes" ? normalizeMoney(values.paymentAmount) : null,
		paidAt: values.paymentAnswer === "yes" ? textOrNull(values.paymentDate) : null,
		confirmationCode:
			values.paymentAnswer === "yes" ? textOrNull(values.paymentConfirmationCode) : null,
	};
}

export function monthlyFourthReviewFromValues(
	values: MonthlyFourthReviewValues,
	period: string,
	idempotencyKey: string,
): MonthlyFourthReviewInput {
	const suspension = monthlyFourthMutationFromValues("suspension", values, period, idempotencyKey);
	const filing = monthlyFourthMutationFromValues("filing", values, period, idempotencyKey);
	const payment = monthlyFourthMutationFromValues("payment", values, period, idempotencyKey);
	if (suspension.kind !== "suspension" || filing.kind !== "filing" || payment.kind !== "payment") {
		throw new Error("Monthly review command could not be built");
	}
	return {
		period,
		idempotencyKey,
		coverage: values.coverage,
		activityClassification: values.activityClassification,
		suspension: {
			answer: suspension.answer,
			authorizationDate: suspension.authorizationDate,
			restartState: suspension.restartState,
			restartDate: suspension.restartDate,
		},
		filing: {
			answer: filing.answer,
			filedAt: filing.filedAt,
			confirmationNumber: filing.confirmationNumber,
		},
		payment: {
			answer: payment.answer,
			amountPen: payment.amountPen,
			paidAt: payment.paidAt,
			confirmationCode: payment.confirmationCode,
		},
	};
}

export function monthlyFourthDefaultsFromPeriod(
	period: MonthlyFourthPeriod,
): MonthlyFourthReviewValues {
	return {
		...monthlyFourthReviewDefaults,
		coverage: period.coverage,
		activityClassification: period.activityClassification ?? "unknown",
		suspensionAnswer: period.suspension?.state ?? "unknown",
		suspensionAuthorizationDate: period.suspension?.authorizationDate ?? "",
		restartAnswer: period.suspension?.restartState ?? "unknown",
		restartDate: period.suspension?.restartDate ?? "",
		filingAnswer: period.filing?.state ?? "unknown",
		filingDate: period.filing?.recordedAt ?? "",
		filingConfirmationNumber: period.filing?.confirmationCode ?? "",
		paymentAnswer: period.payment?.state ?? "unknown",
		paymentAmount: period.payment?.amountPen ?? "",
		paymentDate: period.payment?.recordedAt ?? "",
		paymentConfirmationCode: period.payment?.confirmationCode ?? "",
	};
}
