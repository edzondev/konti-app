import { Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { AdditionalDeductionRules } from "../tax-deductions/additional-deduction.rules";
import { FifthCategoryRules } from "./pe-2026/fifth-category.rules";
import {
	FourthCategoryRules,
	FourthCategoryRulesInputError,
} from "./pe-2026/fourth-category.rules";
import {
	formatMoney,
	isCalendarDateInTaxYear,
	MONEY_INPUT_PATTERN,
	parseMoney,
	ZERO_MONEY,
} from "./pe-2026/money";
import { WorkIncomeConsolidator } from "./pe-2026/work-income-consolidator";
import {
	FOURTH_CATEGORY_2026_ASSUMPTIONS,
	FOURTH_CATEGORY_2026_ASSUMPTIONS_V2,
	FOURTH_CATEGORY_2026_EXCLUSIONS,
	FOURTH_CATEGORY_2026_RULESET,
	FOURTH_CATEGORY_2026_RULESET_V2,
} from "./tax-engine.constants";
import type {
	AnyFourthCategory2026Input,
	AnyFourthCategory2026Output,
	FourthCategory2026Input,
	FourthCategory2026Output,
	LegacyFourthCategory2026Input,
	LegacyFourthCategory2026Output,
	WorkIncomeTax2026Input,
	WorkIncomeTax2026Output,
} from "./tax-engine.types";

export class TaxEngineInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Tax engine input is invalid.");
		this.name = "TaxEngineInputError";
	}
}

function isLegacyInput(input: AnyFourthCategory2026Input): input is LegacyFourthCategory2026Input {
	return "activity" in input;
}

function assertEnvelope(input: {
	taxYear: number;
	jurisdictionCode: string;
	currencyCode: string;
}): void {
	if (input.taxYear !== 2026 || input.jurisdictionCode !== "PE" || input.currencyCode !== "PEN") {
		throw new TaxEngineInputError();
	}
}

function assertLegacyInput(input: LegacyFourthCategory2026Input): void {
	assertEnvelope(input);
	if (input.activity !== "ordinary_independent_services") {
		throw new TaxEngineInputError();
	}

	for (const income of input.incomes) {
		if (
			!isCalendarDateInTaxYear(income.receivedAt, 2026) ||
			!MONEY_INPUT_PATTERN.test(income.grossAmountPen) ||
			!MONEY_INPUT_PATTERN.test(income.withheldTaxAmountPen)
		) {
			throw new TaxEngineInputError();
		}

		const gross = parseMoney(income.grossAmountPen);
		const withholding = parseMoney(income.withheldTaxAmountPen);
		if (!gross.greaterThan(0) || withholding.isNegative() || withholding.greaterThan(gross)) {
			throw new TaxEngineInputError();
		}
	}
}

function calculateProgressiveTax(taxableIncome: Decimal): Decimal {
	const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET.uit);
	let remaining = Decimal.max(taxableIncome, ZERO_MONEY);
	let calculatedTax = ZERO_MONEY;

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
	private readonly fourthCategoryRules = new FourthCategoryRules();
	private readonly fifthCategoryRules = new FifthCategoryRules();
	private readonly workIncomeConsolidator = new WorkIncomeConsolidator();
	private readonly additionalDeductionRules = new AdditionalDeductionRules();

	calculateWorkIncome2026(input: WorkIncomeTax2026Input): WorkIncomeTax2026Output {
		assertEnvelope(input);
		const fourth = this.fourthCategoryRules.calculate(input.fourthIncomes);
		const fifth = this.fifthCategoryRules.calculate(input.employmentIncomes);
		const additionalDeductions = this.additionalDeductionRules.calculate(
			input.deductionRecords ?? [],
		);
		const deductionCount = input.deductionRecords?.length ?? 0;
		const consolidated = this.workIncomeConsolidator.calculate({
			fourth,
			fifth,
			includedAdditionalDeduction: additionalDeductions.includedAdditionalDeduction,
			confirmedAdvancePayments: input.confirmedAdvancePayments ?? "0.00",
			coverage: {
				incomeCoverage: input.fourthIncomes.length > 0 ? "partial" : fifth.incomeCoverage,
				deductionCoverage: deductionCount > 0 ? "partial" : "unknown",
				monthlyCoverage: input.fourthIncomes.length > 0 ? "partial" : "not_applicable",
				excludedFactors: [
					...(input.knownUnregisteredInformation
						? (["known_unregistered_information"] as const)
						: []),
					...additionalDeductions.excludedFactors,
				],
			},
		});
		return {
			...consolidated,
			grossFourthIncome: formatMoney(
				parseMoney(consolidated.grossOrdinaryFourthIncome).plus(
					consolidated.grossSpecialFourthIncome,
				),
			),
			calculatedTaxBeforeAdditionalDeductions: consolidated.calculatedTaxBeforeCredits,
			registeredWithholdings: consolidated.registeredCredits,
			differenceAfterRegisteredWithholdings: consolidated.differenceAfterRegisteredCredits,
			includedIncomeCount:
				consolidated.includedFourthIncomeCount + consolidated.includedFifthIncomeCount,
			additionalDeductions,
			status:
				input.fourthIncomes.length + input.employmentIncomes.length === 0
					? "insufficient_data"
					: "calculated",
		};
	}

	calculateFourthCategory2026(input: LegacyFourthCategory2026Input): LegacyFourthCategory2026Output;
	calculateFourthCategory2026(input: FourthCategory2026Input): FourthCategory2026Output;
	calculateFourthCategory2026(input: AnyFourthCategory2026Input): AnyFourthCategory2026Output {
		return isLegacyInput(input) ? this.calculateLegacy(input) : this.calculateCurrent(input);
	}

	private calculateCurrent(input: FourthCategory2026Input): FourthCategory2026Output {
		assertEnvelope(input);
		let fourth: ReturnType<FourthCategoryRules["calculate"]>;
		try {
			fourth = this.fourthCategoryRules.calculate(input.incomes);
		} catch (error) {
			if (error instanceof FourthCategoryRulesInputError) throw new TaxEngineInputError();
			throw error;
		}

		const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET_V2.uit);
		const netFourthIncome = parseMoney(fourth.netFourthIncome);
		const sevenUitDeduction = Decimal.min(
			Decimal.max(netFourthIncome, ZERO_MONEY),
			uit.times(FOURTH_CATEGORY_2026_RULESET_V2.sevenUitDeduction),
		);
		const preliminaryTaxableWorkIncome = Decimal.max(
			netFourthIncome.minus(sevenUitDeduction),
			ZERO_MONEY,
		);
		const calculatedTax = calculateProgressiveTax(preliminaryTaxableWorkIncome);
		const registeredWithholdings = parseMoney(fourth.registeredFourthWithholdings);
		const grossFourthIncome = parseMoney(fourth.grossOrdinaryFourthIncome).plus(
			fourth.grossSpecialFourthIncome,
		);

		return {
			status: input.incomes.length === 0 ? "insufficient_data" : "calculated",
			rulesetVersion: FOURTH_CATEGORY_2026_RULESET_V2.rulesetVersion,
			taxYear: 2026,
			grossFourthIncome: formatMoney(grossFourthIncome),
			...fourth,
			sevenUitDeduction: formatMoney(sevenUitDeduction),
			preliminaryTaxableWorkIncome: formatMoney(preliminaryTaxableWorkIncome),
			calculatedTaxBeforeAdditionalDeductions: formatMoney(calculatedTax),
			registeredWithholdings: fourth.registeredFourthWithholdings,
			differenceAfterRegisteredWithholdings: formatMoney(
				calculatedTax.minus(registeredWithholdings),
			),
			assumptions: FOURTH_CATEGORY_2026_ASSUMPTIONS_V2,
			exclusions: FOURTH_CATEGORY_2026_EXCLUSIONS,
		};
	}

	private calculateLegacy(input: LegacyFourthCategory2026Input): LegacyFourthCategory2026Output {
		assertLegacyInput(input);
		const grossFourthIncome = input.incomes.reduce(
			(total, income) => total.plus(income.grossAmountPen),
			ZERO_MONEY,
		);
		const registeredWithholdings = input.incomes.reduce(
			(total, income) => total.plus(income.withheldTaxAmountPen),
			ZERO_MONEY,
		);
		const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET.uit);
		const automaticDeduction20 = Decimal.min(
			grossFourthIncome.times(FOURTH_CATEGORY_2026_RULESET.automaticDeductionRate),
			uit.times(FOURTH_CATEGORY_2026_RULESET.automaticDeductionLimitUit),
		);
		const netFourthIncome = grossFourthIncome.minus(automaticDeduction20);
		const sevenUitDeduction = Decimal.min(
			Decimal.max(netFourthIncome, ZERO_MONEY),
			uit.times(FOURTH_CATEGORY_2026_RULESET.sevenUitDeduction),
		);
		const preliminaryTaxableWorkIncome = Decimal.max(
			netFourthIncome.minus(sevenUitDeduction),
			ZERO_MONEY,
		);
		const calculatedTax = calculateProgressiveTax(preliminaryTaxableWorkIncome);

		return {
			status: input.incomes.length === 0 ? "insufficient_data" : "calculated",
			rulesetVersion: FOURTH_CATEGORY_2026_RULESET.rulesetVersion,
			taxYear: FOURTH_CATEGORY_2026_RULESET.taxYear,
			grossFourthIncome: formatMoney(grossFourthIncome),
			automaticDeduction20: formatMoney(automaticDeduction20),
			netFourthIncome: formatMoney(netFourthIncome),
			sevenUitDeduction: formatMoney(sevenUitDeduction),
			preliminaryTaxableWorkIncome: formatMoney(preliminaryTaxableWorkIncome),
			calculatedTaxBeforeAdditionalDeductions: formatMoney(calculatedTax),
			registeredWithholdings: formatMoney(registeredWithholdings),
			differenceAfterRegisteredWithholdings: formatMoney(
				calculatedTax.minus(registeredWithholdings),
			),
			includedIncomeCount: input.incomes.length,
			assumptions: FOURTH_CATEGORY_2026_ASSUMPTIONS,
			exclusions: FOURTH_CATEGORY_2026_EXCLUSIONS,
		};
	}
}
