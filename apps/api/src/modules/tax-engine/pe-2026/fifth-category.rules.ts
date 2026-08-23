import {
	formatMoney,
	isCalendarDateInTaxYear,
	MONEY_INPUT_PATTERN,
	parseMoney,
	ZERO_MONEY,
} from "./money";

export type EmploymentCalculationDisposition =
	| "included"
	| "excluded_by_coverage"
	| "needs_resolution";

export type EmploymentIncome2026 = {
	readonly id: string;
	readonly recordKind?: "period" | "year_to_date_snapshot";
	readonly coverageStart: string;
	readonly coverageEnd: string;
	readonly coverageScope?: "single_payer" | "all_employers";
	readonly grossAmountPen: string;
	readonly withheldTaxAmountPen: string;
	readonly calculationDisposition: EmploymentCalculationDisposition;
	readonly payerTaxId: string | null;
	readonly payerName: string | null;
};

export type FifthCategoryEmployer = {
	readonly payerTaxId: string | null;
	readonly payerName: string | null;
};

export type FifthCategoryCoverageRange = {
	readonly start: string;
	readonly end: string;
};

export type FifthCategoryResult = {
	readonly grossFifthIncome: string;
	readonly registeredFifthWithholdings: string;
	readonly includedIncomeCount: number;
	readonly unresolvedIncomeCount: number;
	readonly employers: readonly FifthCategoryEmployer[];
	readonly includedCoverageStart: string | null;
	readonly includedCoverageEnd: string | null;
	readonly includedCoverageRanges: readonly FifthCategoryCoverageRange[];
	readonly missingMonths: readonly string[];
	readonly hasMultipleEmployers: boolean;
	readonly incomeCoverage: "complete" | "partial" | "unknown";
};

export class FifthCategoryRulesInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Fifth-category input is invalid.");
		this.name = "FifthCategoryRulesInputError";
	}
}

function assertIncome(income: EmploymentIncome2026): void {
	if (
		!income.id ||
		!isCalendarDateInTaxYear(income.coverageStart, 2026) ||
		!isCalendarDateInTaxYear(income.coverageEnd, 2026) ||
		income.coverageStart > income.coverageEnd ||
		!MONEY_INPUT_PATTERN.test(income.grossAmountPen) ||
		!MONEY_INPUT_PATTERN.test(income.withheldTaxAmountPen) ||
		!(["included", "excluded_by_coverage", "needs_resolution"] as const).includes(
			income.calculationDisposition,
		)
	) {
		throw new FifthCategoryRulesInputError();
	}
	if (
		(income.recordKind !== undefined &&
			income.recordKind !== "period" &&
			income.recordKind !== "year_to_date_snapshot") ||
		(income.coverageScope !== undefined &&
			income.coverageScope !== "single_payer" &&
			income.coverageScope !== "all_employers")
	) {
		throw new FifthCategoryRulesInputError();
	}

	const gross = parseMoney(income.grossAmountPen);
	const withholding = parseMoney(income.withheldTaxAmountPen);
	if (!gross.greaterThan(0) || withholding.isNegative() || withholding.greaterThan(gross)) {
		throw new FifthCategoryRulesInputError();
	}
}

function normalizePayerName(value: string | null): string | null {
	if (!value) return null;
	const normalized = value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("es-PE")
		.replace(/[^a-z0-9]/g, "");
	return normalized.length > 0 ? normalized : null;
}

function employerKey(income: EmploymentIncome2026): string | null {
	if (income.payerTaxId) return `tax-id:${income.payerTaxId}`;
	const normalizedName = normalizePayerName(income.payerName);
	return normalizedName ? `name:${normalizedName}` : null;
}

const TAX_YEAR_MONTHS = Array.from(
	{ length: 12 },
	(_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

function monthHasRegisteredCoverage(
	month: string,
	ranges: readonly FifthCategoryCoverageRange[],
): boolean {
	const monthStart = `${month}-01`;
	const [, numericMonth] = month.split("-").map(Number);
	const lastDay = new Date(Date.UTC(2026, numericMonth ?? 1, 0)).getUTCDate();
	const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;
	return ranges.some((range) => range.start <= monthEnd && range.end >= monthStart);
}

export class FifthCategoryRules {
	calculate(incomes: readonly EmploymentIncome2026[]): FifthCategoryResult {
		for (const income of incomes) assertIncome(income);

		const included = incomes.filter((income) => income.calculationDisposition === "included");
		let grossFifthIncome = ZERO_MONEY;
		let registeredFifthWithholdings = ZERO_MONEY;
		const employersByKey = new Map<string, FifthCategoryEmployer>();
		const coverageRangesByKey = new Map<string, FifthCategoryCoverageRange>();

		for (const income of included) {
			grossFifthIncome = grossFifthIncome.plus(income.grossAmountPen);
			registeredFifthWithholdings = registeredFifthWithholdings.plus(income.withheldTaxAmountPen);
			const payerKey = employerKey(income);
			if (payerKey && !employersByKey.has(payerKey)) {
				employersByKey.set(payerKey, {
					payerTaxId: income.payerTaxId,
					payerName: income.payerName,
				});
			}
			const rangeKey = `${income.coverageStart}:${income.coverageEnd}`;
			coverageRangesByKey.set(rangeKey, {
				start: income.coverageStart,
				end: income.coverageEnd,
			});
		}

		const includedCoverageRanges = [...coverageRangesByKey.values()].sort(
			(left, right) => left.start.localeCompare(right.start) || left.end.localeCompare(right.end),
		);
		const employers = [...employersByKey.values()].sort((left, right) => {
			const leftKey = left.payerTaxId ?? normalizePayerName(left.payerName) ?? "";
			const rightKey = right.payerTaxId ?? normalizePayerName(right.payerName) ?? "";
			return leftKey.localeCompare(rightKey);
		});
		const includedCoverageEnd = includedCoverageRanges.reduce<string | null>(
			(latest, range) => (latest === null || range.end > latest ? range.end : latest),
			null,
		);
		const missingMonths =
			included.length === 0
				? []
				: TAX_YEAR_MONTHS.filter(
						(month) => !monthHasRegisteredCoverage(month, includedCoverageRanges),
					);
		const hasMultipleEmployers = employers.length > 1;

		return {
			grossFifthIncome: formatMoney(grossFifthIncome),
			registeredFifthWithholdings: formatMoney(registeredFifthWithholdings),
			includedIncomeCount: included.length,
			unresolvedIncomeCount: incomes.filter(
				(income) => income.calculationDisposition === "needs_resolution",
			).length,
			employers,
			includedCoverageStart: includedCoverageRanges[0]?.start ?? null,
			includedCoverageEnd,
			includedCoverageRanges,
			missingMonths,
			hasMultipleEmployers,
			incomeCoverage:
				included.length === 0
					? "unknown"
					: missingMonths.length === 0 &&
							incomes.every((income) => income.calculationDisposition !== "needs_resolution")
						? "complete"
						: "partial",
		};
	}
}
