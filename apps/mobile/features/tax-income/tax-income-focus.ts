import type { TaxIncomeFilter, TaxIncomeRecord } from "./types";

function matchesFilter(record: TaxIncomeRecord, filter: TaxIncomeFilter): boolean {
	if (filter === "all") return true;
	if (filter === "employment") return record.incomeType === "employment";
	return record.incomeType === "fourth_ordinary" || record.incomeType === "fourth_special";
}

export function recordsWithFocusedIncome(
	records: readonly TaxIncomeRecord[],
	focusedRecord: TaxIncomeRecord | undefined,
	focusId: string | undefined,
	filter: TaxIncomeFilter,
): TaxIncomeRecord[] {
	if (!focusId) return [...records];

	const target = records.find((record) => record.id === focusId) ?? focusedRecord;
	if (!target || !matchesFilter(target, filter)) return [...records];

	return [target, ...records.filter((record) => record.id !== target.id)];
}
