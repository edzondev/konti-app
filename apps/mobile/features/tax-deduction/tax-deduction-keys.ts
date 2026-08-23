export const taxDeductionKeys = {
	all: ["tax-deductions"] as const,
	collection: (userId: string, taxYear: number) =>
		[...taxDeductionKeys.all, "collection", userId, taxYear] as const,
};
