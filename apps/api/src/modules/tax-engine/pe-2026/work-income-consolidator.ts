import Decimal from "decimal.js";
import { FOURTH_CATEGORY_2026_RULESET_V2 } from "../tax-engine.constants";
import type { FifthCategoryResult } from "./fifth-category.rules";
import type { FourthCategoryResult } from "./fourth-category.rules";
import { formatMoney, MONEY_INPUT_PATTERN, parseMoney, ZERO_MONEY } from "./money";

export type TaxCoverageState = "complete" | "partial" | "unknown";
export type MonthlyTaxCoverageState = "complete" | "partial" | "unknown" | "not_applicable";

export type TaxExcludedFactor =
	| "foreign_source_income"
	| "prior_year_credit_balance"
	| "rent_attribution"
	| "other_annual_credit"
	| "annual_filing_obligation_not_determined"
	| "known_unregistered_information";

export type TaxCoverage = {
	readonly incomeCoverage: TaxCoverageState;
	readonly deductionCoverage: TaxCoverageState;
	readonly monthlyCoverage: MonthlyTaxCoverageState;
	readonly excludedFactors: readonly TaxExcludedFactor[];
};

export type WorkIncome2026Input = {
	readonly fourth: FourthCategoryResult;
	readonly fifth: FifthCategoryResult;
	readonly includedAdditionalDeduction: string;
	readonly confirmedAdvancePayments: string;
	readonly coverage: TaxCoverage;
};

export type WorkIncome2026Output = {
	readonly rulesetVersion: "pe-2026.2.0";
	readonly taxYear: 2026;
	readonly grossOrdinaryFourthIncome: string;
	readonly automaticDeduction20: string;
	readonly netOrdinaryFourthIncome: string;
	readonly grossSpecialFourthIncome: string;
	readonly netFourthIncome: string;
	readonly grossFifthIncome: string;
	readonly combinedNetWorkIncome: string;
	readonly sevenUitDeduction: string;
	readonly includedAdditionalDeduction: string;
	readonly appliedAdditionalDeduction: string;
	readonly netTaxableWorkIncome: string;
	readonly calculatedTaxBeforeCredits: string;
	readonly registeredFourthWithholdings: string;
	readonly registeredFifthWithholdings: string;
	readonly confirmedAdvancePayments: string;
	readonly registeredCredits: string;
	readonly differenceAfterRegisteredCredits: string;
	readonly includedFourthIncomeCount: number;
	readonly includedFifthIncomeCount: number;
	readonly employers: FifthCategoryResult["employers"];
	readonly employmentCoverageRanges: FifthCategoryResult["includedCoverageRanges"];
	readonly missingEmploymentMonths: FifthCategoryResult["missingMonths"];
	readonly hasMultipleEmployers: boolean;
	readonly coverage: TaxCoverage;
	readonly isDefinitive: boolean;
};

const TAX_EXCLUDED_FACTORS = [
	"foreign_source_income",
	"prior_year_credit_balance",
	"rent_attribution",
	"other_annual_credit",
	"annual_filing_obligation_not_determined",
	"known_unregistered_information",
] as const satisfies readonly TaxExcludedFactor[];

export class WorkIncomeConsolidatorInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Work-income consolidation input is invalid.");
		this.name = "WorkIncomeConsolidatorInputError";
	}
}

function parseNonNegativeMoney(value: string): Decimal {
	if (!MONEY_INPUT_PATTERN.test(value)) throw new WorkIncomeConsolidatorInputError();
	const amount = parseMoney(value);
	if (amount.isNegative()) throw new WorkIncomeConsolidatorInputError();
	return amount;
}

function assertCount(value: number): void {
	if (!Number.isSafeInteger(value) || value < 0) throw new WorkIncomeConsolidatorInputError();
}

function assertFourthResult(result: FourthCategoryResult): void {
	const grossOrdinary = parseNonNegativeMoney(result.grossOrdinaryFourthIncome);
	const automaticDeduction = parseNonNegativeMoney(result.automaticDeduction20);
	const netOrdinary = parseNonNegativeMoney(result.netOrdinaryFourthIncome);
	const grossSpecial = parseNonNegativeMoney(result.grossSpecialFourthIncome);
	const netFourth = parseNonNegativeMoney(result.netFourthIncome);
	const withholding = parseNonNegativeMoney(result.registeredFourthWithholdings);
	assertCount(result.includedIncomeCount);

	if (
		!grossOrdinary.minus(automaticDeduction).equals(netOrdinary) ||
		!netOrdinary.plus(grossSpecial).equals(netFourth) ||
		withholding.greaterThan(grossOrdinary.plus(grossSpecial))
	) {
		throw new WorkIncomeConsolidatorInputError();
	}
}

function assertFifthResult(result: FifthCategoryResult): void {
	const gross = parseNonNegativeMoney(result.grossFifthIncome);
	const withholding = parseNonNegativeMoney(result.registeredFifthWithholdings);
	assertCount(result.includedIncomeCount);
	assertCount(result.unresolvedIncomeCount);
	if (withholding.greaterThan(gross)) throw new WorkIncomeConsolidatorInputError();
}

function assertCoverage(coverage: TaxCoverage): void {
	const annualStates: readonly TaxCoverageState[] = ["complete", "partial", "unknown"];
	const monthlyStates: readonly MonthlyTaxCoverageState[] = [
		"complete",
		"partial",
		"unknown",
		"not_applicable",
	];
	if (
		!annualStates.includes(coverage.incomeCoverage) ||
		!annualStates.includes(coverage.deductionCoverage) ||
		!monthlyStates.includes(coverage.monthlyCoverage) ||
		coverage.excludedFactors.some((factor) => !TAX_EXCLUDED_FACTORS.includes(factor))
	) {
		throw new WorkIncomeConsolidatorInputError();
	}
}

function calculateProgressiveTax(taxableIncome: Decimal): Decimal {
	const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET_V2.uit);
	let remaining = Decimal.max(taxableIncome, ZERO_MONEY);
	let calculatedTax = ZERO_MONEY;

	for (const bracket of FOURTH_CATEGORY_2026_RULESET_V2.progressiveBrackets) {
		if (remaining.isZero()) break;
		const taxableInBracket =
			bracket.widthUit === null ? remaining : Decimal.min(remaining, uit.times(bracket.widthUit));
		calculatedTax = calculatedTax.plus(taxableInBracket.times(bracket.rate));
		remaining = remaining.minus(taxableInBracket);
	}

	return calculatedTax;
}

export class WorkIncomeConsolidator {
	calculate(input: WorkIncome2026Input): WorkIncome2026Output {
		assertFourthResult(input.fourth);
		assertFifthResult(input.fifth);
		assertCoverage(input.coverage);

		const includedAdditionalDeduction = parseNonNegativeMoney(input.includedAdditionalDeduction);
		const confirmedAdvancePayments = parseNonNegativeMoney(input.confirmedAdvancePayments);
		const uit = new Decimal(FOURTH_CATEGORY_2026_RULESET_V2.uit);

		const netOrdinaryFourthIncome = parseMoney(input.fourth.netOrdinaryFourthIncome);
		const grossSpecialFourthIncome = parseMoney(input.fourth.grossSpecialFourthIncome);
		const grossFifthIncome = parseMoney(input.fifth.grossFifthIncome);
		const combinedNetWorkIncome = netOrdinaryFourthIncome
			.plus(grossSpecialFourthIncome)
			.plus(grossFifthIncome);
		const sevenUitDeduction = Decimal.min(combinedNetWorkIncome, uit.times(7));
		const afterSevenUit = Decimal.max(combinedNetWorkIncome.minus(sevenUitDeduction), ZERO_MONEY);
		const appliedAdditionalDeduction = Decimal.min(
			afterSevenUit,
			includedAdditionalDeduction,
			uit.times(3),
		);
		const netTaxableWorkIncome = afterSevenUit.minus(appliedAdditionalDeduction);
		const calculatedTaxBeforeCredits = calculateProgressiveTax(netTaxableWorkIncome);
		const registeredFourthWithholdings = parseMoney(input.fourth.registeredFourthWithholdings);
		const registeredFifthWithholdings = parseMoney(input.fifth.registeredFifthWithholdings);
		const registeredCredits = registeredFourthWithholdings
			.plus(registeredFifthWithholdings)
			.plus(confirmedAdvancePayments);
		const differenceAfterRegisteredCredits = calculatedTaxBeforeCredits.minus(registeredCredits);
		const excludedFactors = [
			...new Set<TaxExcludedFactor>([
				...input.coverage.excludedFactors,
				"annual_filing_obligation_not_determined",
			]),
		];
		const outputCoverage: TaxCoverage = {
			...input.coverage,
			incomeCoverage:
				input.fifth.unresolvedIncomeCount > 0 ? "partial" : input.coverage.incomeCoverage,
			excludedFactors,
		};
		const hasCompleteCoverage =
			outputCoverage.incomeCoverage === "complete" &&
			outputCoverage.deductionCoverage === "complete" &&
			(outputCoverage.monthlyCoverage === "complete" ||
				outputCoverage.monthlyCoverage === "not_applicable");

		return {
			rulesetVersion: "pe-2026.2.0",
			taxYear: 2026,
			grossOrdinaryFourthIncome: formatMoney(parseMoney(input.fourth.grossOrdinaryFourthIncome)),
			automaticDeduction20: formatMoney(parseMoney(input.fourth.automaticDeduction20)),
			netOrdinaryFourthIncome: formatMoney(netOrdinaryFourthIncome),
			grossSpecialFourthIncome: formatMoney(grossSpecialFourthIncome),
			netFourthIncome: formatMoney(netOrdinaryFourthIncome.plus(grossSpecialFourthIncome)),
			grossFifthIncome: formatMoney(grossFifthIncome),
			combinedNetWorkIncome: formatMoney(combinedNetWorkIncome),
			sevenUitDeduction: formatMoney(sevenUitDeduction),
			includedAdditionalDeduction: formatMoney(includedAdditionalDeduction),
			appliedAdditionalDeduction: formatMoney(appliedAdditionalDeduction),
			netTaxableWorkIncome: formatMoney(netTaxableWorkIncome),
			calculatedTaxBeforeCredits: formatMoney(calculatedTaxBeforeCredits),
			registeredFourthWithholdings: formatMoney(registeredFourthWithholdings),
			registeredFifthWithholdings: formatMoney(registeredFifthWithholdings),
			confirmedAdvancePayments: formatMoney(confirmedAdvancePayments),
			registeredCredits: formatMoney(registeredCredits),
			differenceAfterRegisteredCredits: formatMoney(differenceAfterRegisteredCredits),
			includedFourthIncomeCount: input.fourth.includedIncomeCount,
			includedFifthIncomeCount: input.fifth.includedIncomeCount,
			employers: input.fifth.employers,
			employmentCoverageRanges: input.fifth.includedCoverageRanges,
			missingEmploymentMonths: input.fifth.missingMonths,
			hasMultipleEmployers: input.fifth.hasMultipleEmployers,
			coverage: outputCoverage,
			isDefinitive: hasCompleteCoverage && excludedFactors.length === 0,
		};
	}
}
