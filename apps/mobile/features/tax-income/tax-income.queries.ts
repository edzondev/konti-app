import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getTaxIncome, getTaxIncomes } from "./tax-income.api";

export const taxIncomeKeys = {
	all: ["tax-income-records"] as const,
	lists: () => [...taxIncomeKeys.all, "list"] as const,
	list: (year: number) => [...taxIncomeKeys.lists(), year] as const,
	detail: (id: string) => [...taxIncomeKeys.all, "detail", id] as const,
};

export const taxIncomeListQueryOptions = (userId: string, year = 2026) =>
	infiniteQueryOptions({
		queryKey: taxIncomeKeys.list(year),
		queryFn: ({ pageParam }) => getTaxIncomes(pageParam, year),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.nextCursor ?? undefined,
		enabled: Boolean(userId),
	});

export const taxIncomeDetailQueryOptions = (userId: string, recordId: string) =>
	queryOptions({
		queryKey: taxIncomeKeys.detail(recordId),
		queryFn: () => getTaxIncome(recordId),
		enabled: Boolean(userId && recordId),
	});
