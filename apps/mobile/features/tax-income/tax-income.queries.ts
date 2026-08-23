import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getTaxIncome, getTaxIncomes } from "./tax-income.api";
import { taxIncomeKeys } from "./tax-income.keys";
import type { TaxIncomeFilter } from "./types";

export { taxIncomeKeys } from "./tax-income.keys";

export const taxIncomeListQueryOptions = (
	userId: string,
	year = 2026,
	filter: TaxIncomeFilter = "all",
) =>
	infiniteQueryOptions({
		queryKey: taxIncomeKeys.list(userId, year, filter),
		queryFn: ({ pageParam }) => getTaxIncomes(pageParam, year, filter),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.nextCursor ?? undefined,
		enabled: Boolean(userId),
	});

export const taxIncomeDetailQueryOptions = (userId: string, recordId: string) =>
	queryOptions({
		queryKey: taxIncomeKeys.detail(userId, recordId),
		queryFn: () => getTaxIncome(recordId),
		enabled: Boolean(userId && recordId),
	});
