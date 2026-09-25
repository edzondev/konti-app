import { formatMoney, monthLabel } from "./home-format";
import { currentLimaMonth, type HomeSummary } from "./home-summary";
import { useHomeSummary } from "./use-home-summary";

export type HomeView =
	| { kind: "loading" }
	| { kind: "error"; message: string }
	| { kind: "empty"; monthLabel: string }
	| {
			kind: "ready";
			monthLabel: string;
			monthName: string;
			totalAmountLabel: string;
			insight: string;
			categories: { name: string; amountLabel: string; muted: boolean }[];
			deductibles: HomeSummary["deductibles"];
			deductions:
				| { variant: "none"; message: string }
				| {
						variant: "highlight";
						count: number;
						categoryNames: string[];
						summary: { before: string; emphasis: string; after: string };
						categoriesLine: string;
				  };
	  };

function toReadyView(summary: HomeSummary): HomeView {
	const { deductibles } = summary;
	const label = monthLabel(summary.month);

	return {
		kind: "ready",
		monthLabel: label,
		monthName: label.split(" ")[0]!.toLowerCase(),
		totalAmountLabel: formatMoney(summary.totalAmount),
		insight: summary.insight,
		categories: summary.categories.map(({ name, amount }) => ({
			name,
			amountLabel: formatMoney(amount),
			muted: name === "Otros",
		})),
		deductibles,
		deductions:
			deductibles.count === 0
				? {
						variant: "none",
						message: "Este mes no hubo gastos que suelan aplicar.",
					}
				: {
						variant: "highlight",
						count: deductibles.count,
						categoryNames: deductibles.categoryNames,
						summary: {
							before: `${deductibles.count} gastos podrían `,
							emphasis: "reducir tu impuesto anual",
							after: "",
						},
						categoriesLine: `Categorías: ${deductibles.categoryNames.join(", ")}.`,
					},
	};
}

export function useHomeView(): HomeView {
	const month = currentLimaMonth();
	const { data, isError } = useHomeSummary(month);

	if (data) {
		if (data.documentCount === 0 && data.processingCount > 0) {
			return { kind: "loading" };
		}
		if (data.documentCount === 0) {
			return { kind: "empty", monthLabel: monthLabel(data.month) };
		}
		return toReadyView(data);
	}

	if (isError) {
		return { kind: "error", message: "No pudimos cargar tu resumen." };
	}
	return { kind: "loading" };
}
