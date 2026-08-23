import { queryOptions } from "@tanstack/react-query";

import { getMonthlyFourthPeriod } from "./monthly-fourth-api";
import { monthlyFourthKeys } from "./monthly-fourth-keys";

export { monthlyFourthKeys } from "./monthly-fourth-keys";

export const monthlyFourthPeriodQueryOptions = (userId: string, period: string) =>
	queryOptions({
		queryKey: monthlyFourthKeys.period(userId, period),
		queryFn: () => getMonthlyFourthPeriod(period),
		enabled: Boolean(userId && period),
	});
