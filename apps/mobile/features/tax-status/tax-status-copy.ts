import { compareMoney, formatPen } from "../tax-income/money";
import type { FourthCategory2026Output } from "./types";

type TaxEstimateBreakdownInput = Pick<
	FourthCategory2026Output,
	"automaticDeduction20" | "netFourthIncome" | "sevenUitDeduction" | "preliminaryTaxableWorkIncome"
>;

export function taxEstimateBreakdown(output: TaxEstimateBreakdownInput) {
	return [
		{ label: "Deducción automática 20%", value: output.automaticDeduction20 },
		{ label: "Renta neta de cuarta", value: output.netFourthIncome },
		{ label: "Deducción 7 UIT", value: output.sevenUitDeduction },
		{ label: "Renta preliminar imponible", value: output.preliminaryTaxableWorkIncome },
	] as const;
}

export function differenceCopy(difference: string): string {
	const comparison = compareMoney(difference, "0.00");
	if (comparison === 0) return "La estimación coincide con las retenciones registradas.";

	if (comparison === 1) {
		return `La estimación supera las retenciones registradas por ${formatPen(difference)}.`;
	}

	return `Las retenciones registradas superan la estimación por ${formatPen(difference.slice(1))}.`;
}
