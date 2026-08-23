import Decimal from "decimal.js";
import { FOURTH_CATEGORY_2026_RULESET_V2 } from "../tax-engine.constants";
import type { FourthCategory2026Income } from "../tax-engine.types";
import {
	formatMoney,
	isCalendarDateInTaxYear,
	MONEY_INPUT_PATTERN,
	parseMoney,
	ZERO_MONEY,
} from "./money";

export type FourthCategoryResult = {
	grossOrdinaryFourthIncome: string;
	automaticDeduction20: string;
	netOrdinaryFourthIncome: string;
	grossSpecialFourthIncome: string;
	netFourthIncome: string;
	registeredFourthWithholdings: string;
	includedIncomeCount: number;
};

export class FourthCategoryRulesInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Fourth-category input is invalid.");
		this.name = "FourthCategoryRulesInputError";
	}
}

function assertIncome(income: FourthCategory2026Income): void {
	if (
		(income.activityType !== "fourth_ordinary" && income.activityType !== "fourth_special") ||
		!isCalendarDateInTaxYear(income.receivedAt, 2026) ||
		!MONEY_INPUT_PATTERN.test(income.grossAmountPen) ||
		!MONEY_INPUT_PATTERN.test(income.withheldTaxAmountPen)
	) {
		throw new FourthCategoryRulesInputError();
	}

	const gross = parseMoney(income.grossAmountPen);
	const withholding = parseMoney(income.withheldTaxAmountPen);
	if (!gross.greaterThan(0) || withholding.isNegative() || withholding.greaterThan(gross)) {
		throw new FourthCategoryRulesInputError();
	}
}

export class FourthCategoryRules {
	calculate(incomes: readonly FourthCategory2026Income[]): FourthCategoryResult {
		let grossOrdinary = ZERO_MONEY;
		let grossSpecial = ZERO_MONEY;
		let withholdings = ZERO_MONEY;

		for (const income of incomes) {
			assertIncome(income);
			const gross = parseMoney(income.grossAmountPen);
			if (income.activityType === "fourth_ordinary") {
				grossOrdinary = grossOrdinary.plus(gross);
			} else {
				grossSpecial = grossSpecial.plus(gross);
			}
			withholdings = withholdings.plus(income.withheldTaxAmountPen);
		}

		const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET_V2.uit);
		const automaticDeduction20 = Decimal.min(
			grossOrdinary.times(FOURTH_CATEGORY_2026_RULESET_V2.automaticDeductionRate),
			uit.times(FOURTH_CATEGORY_2026_RULESET_V2.automaticDeductionLimitUit),
		);
		const netOrdinary = grossOrdinary.minus(automaticDeduction20);

		return {
			grossOrdinaryFourthIncome: formatMoney(grossOrdinary),
			automaticDeduction20: formatMoney(automaticDeduction20),
			netOrdinaryFourthIncome: formatMoney(netOrdinary),
			grossSpecialFourthIncome: formatMoney(grossSpecial),
			netFourthIncome: formatMoney(netOrdinary.plus(grossSpecial)),
			registeredFourthWithholdings: formatMoney(withholdings),
			includedIncomeCount: incomes.length,
		};
	}
}
