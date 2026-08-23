export const monthlyFourthKeys = {
	all: ["monthly-fourth"] as const,
	periods: () => [...monthlyFourthKeys.all, "period"] as const,
	period: (userId: string, period: string) =>
		[...monthlyFourthKeys.periods(), userId, period] as const,
};
