import {
	type DateOnly,
	dateOnlyToPickerDate,
	isDateOnly,
	pickerDateToDateOnly,
	todayDateOnlyInLima,
} from "@/shared/date-only";

export const MONTHLY_FOURTH_MINIMUM_DATE: DateOnly = "2026-01-01";
export const MONTHLY_FOURTH_SUSPENSION_MAXIMUM_DATE: DateOnly = "2026-12-31";

export function monthlyFourthDateLimits(now = new Date()) {
	const today = todayDateOnlyInLima(now);
	return {
		today,
		suspensionMaximumDate:
			today < MONTHLY_FOURTH_SUSPENSION_MAXIMUM_DATE
				? today
				: MONTHLY_FOURTH_SUSPENSION_MAXIMUM_DATE,
		occurredFactMaximumDate: today,
	};
}

export function restartDateLimits(
	authorizationDate: string,
	maximumDate: DateOnly,
): {
	effectiveMinimumDate: DateOnly;
	minimumDate: DateOnly;
	maximumDate: DateOnly;
	hasSelectableDate: boolean;
} {
	const effectiveMinimum = nextDateOnly(authorizationDate) ?? MONTHLY_FOURTH_MINIMUM_DATE;
	const hasSelectableDate = effectiveMinimum <= maximumDate;
	return {
		effectiveMinimumDate: effectiveMinimum,
		minimumDate: hasSelectableDate ? effectiveMinimum : maximumDate,
		maximumDate,
		hasSelectableDate,
	};
}

export function reconcileRestartDate(
	restartDate: string,
	minimumDate: DateOnly,
	maximumDate: DateOnly,
): DateOnly | "" {
	if (!restartDate) return "";
	if (!isDateOnly(restartDate) || restartDate < minimumDate || restartDate > maximumDate) return "";
	return restartDate;
}

function nextDateOnly(value: string): DateOnly | null {
	if (!isDateOnly(value)) return null;
	const next = dateOnlyToPickerDate(value);
	next.setUTCDate(next.getUTCDate() + 1);
	return pickerDateToDateOnly(next);
}
