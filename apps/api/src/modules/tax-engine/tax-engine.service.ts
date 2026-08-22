import { Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import {
	FOURTH_CATEGORY_2026_ASSUMPTIONS,
	FOURTH_CATEGORY_2026_EXCLUSIONS,
	FOURTH_CATEGORY_2026_RULESET,
} from "./tax-engine.constants";
import type { FourthCategory2026Input, FourthCategory2026Output } from "./tax-engine.types";

const ZERO = new Decimal(0);
const MONEY_INPUT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export class TaxEngineInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Tax engine input is invalid.");
		this.name = "TaxEngineInputError";
	}
}

function isCalendarDateIn2026(value: string): boolean {
	if (!/^2026-\d{2}-\d{2}$/.test(value)) return false;

	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function assertValidInput(input: FourthCategory2026Input): void {
	if (
		input.taxYear !== 2026 ||
		input.jurisdictionCode !== "PE" ||
		input.currencyCode !== "PEN" ||
		input.activity !== "ordinary_independent_services"
	) {
		throw new TaxEngineInputError();
	}

	for (const income of input.incomes) {
		if (
			!isCalendarDateIn2026(income.receivedAt) ||
			!MONEY_INPUT_PATTERN.test(income.grossAmountPen) ||
			!MONEY_INPUT_PATTERN.test(income.withheldTaxAmountPen)
		) {
			throw new TaxEngineInputError();
		}

		const grossAmount = new Decimal(income.grossAmountPen);
		const withheldTaxAmount = new Decimal(income.withheldTaxAmountPen);

		if (
			!grossAmount.isPositive() ||
			withheldTaxAmount.isNegative() ||
			withheldTaxAmount.greaterThan(grossAmount)
		) {
			throw new TaxEngineInputError();
		}
	}
}

function money(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function calculateProgressiveTax(taxableIncome: Decimal): Decimal {
	const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET.uit);
	let remaining = Decimal.max(taxableIncome, ZERO);
	let calculatedTax = ZERO;

	for (const bracket of FOURTH_CATEGORY_2026_RULESET.progressiveBrackets) {
		if (remaining.isZero()) break;

		const taxableInBracket =
			bracket.widthUit === null ? remaining : Decimal.min(remaining, uit.times(bracket.widthUit));

		calculatedTax = calculatedTax.plus(taxableInBracket.times(bracket.rate));
		remaining = remaining.minus(taxableInBracket);
	}

	return calculatedTax;
}

@Injectable()
export class TaxEngineService {
	calculateFourthCategory2026(input: FourthCategory2026Input): FourthCategory2026Output {
		assertValidInput(input);

		const grossFourthIncome = input.incomes.reduce(
			(total, income) => total.plus(income.grossAmountPen),
			ZERO,
		);
		const registeredWithholdings = input.incomes.reduce(
			(total, income) => total.plus(income.withheldTaxAmountPen),
			ZERO,
		);
		const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET.uit);
		const automaticDeduction20 = Decimal.min(
			grossFourthIncome.times(FOURTH_CATEGORY_2026_RULESET.automaticDeductionRate),
			uit.times(FOURTH_CATEGORY_2026_RULESET.automaticDeductionLimitUit),
		);
		const netFourthIncome = grossFourthIncome.minus(automaticDeduction20);
		const sevenUitDeduction = Decimal.min(
			Decimal.max(netFourthIncome, ZERO),
			uit.times(FOURTH_CATEGORY_2026_RULESET.sevenUitDeduction),
		);
		const preliminaryTaxableWorkIncome = Decimal.max(
			netFourthIncome.minus(sevenUitDeduction),
			ZERO,
		);
		const calculatedTaxBeforeAdditionalDeductions = calculateProgressiveTax(
			preliminaryTaxableWorkIncome,
		);
		const differenceAfterRegisteredWithholdings =
			calculatedTaxBeforeAdditionalDeductions.minus(registeredWithholdings);

		return {
			status: input.incomes.length === 0 ? "insufficient_data" : "calculated",
			rulesetVersion: FOURTH_CATEGORY_2026_RULESET.rulesetVersion,
			taxYear: FOURTH_CATEGORY_2026_RULESET.taxYear,
			grossFourthIncome: money(grossFourthIncome),
			automaticDeduction20: money(automaticDeduction20),
			netFourthIncome: money(netFourthIncome),
			sevenUitDeduction: money(sevenUitDeduction),
			preliminaryTaxableWorkIncome: money(preliminaryTaxableWorkIncome),
			calculatedTaxBeforeAdditionalDeductions: money(calculatedTaxBeforeAdditionalDeductions),
			registeredWithholdings: money(registeredWithholdings),
			differenceAfterRegisteredWithholdings: money(differenceAfterRegisteredWithholdings),
			includedIncomeCount: input.incomes.length,
			assumptions: FOURTH_CATEGORY_2026_ASSUMPTIONS,
			exclusions: FOURTH_CATEGORY_2026_EXCLUSIONS,
		};
	}
}
