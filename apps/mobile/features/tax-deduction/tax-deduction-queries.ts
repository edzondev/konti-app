import { queryOptions } from "@tanstack/react-query";

import { getTaxDeductionCollection } from "./tax-deduction-api";
import { taxDeductionCollectionQueryConfig } from "./tax-deduction-query-config";

export function taxDeductionCollectionQueryOptions(userId: string, taxYear: number) {
	const config = taxDeductionCollectionQueryConfig(userId, taxYear);
	return queryOptions({
		queryKey: config.queryKey,
		queryFn: () => getTaxDeductionCollection(taxYear),
		enabled: config.enabled,
	});
}
