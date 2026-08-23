import { taxDeductionKeys } from "./tax-deduction-keys";

export function taxDeductionCollectionQueryConfig(userId: string, taxYear: number) {
	return {
		queryKey: taxDeductionKeys.collection(userId, taxYear),
		enabled: Boolean(userId) && taxYear === 2026,
	} as const;
}
