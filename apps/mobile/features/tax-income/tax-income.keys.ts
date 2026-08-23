export const taxIncomeKeys = {
	root: ["tax-income-records"] as const,
	all: (userId: string) => [...taxIncomeKeys.root, userId] as const,
	lists: (userId: string) => [...taxIncomeKeys.all(userId), "list"] as const,
	list: (userId: string, year: number, filter: "all" | "employment" | "fourth" = "all") =>
		[...taxIncomeKeys.lists(userId), year, filter] as const,
	detail: (userId: string, id: string) => [...taxIncomeKeys.all(userId), "detail", id] as const,
};
