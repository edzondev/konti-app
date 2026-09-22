import { activeHomeMock } from "./home-mock"; // change which mock activeHomeMock points at for QA.
import { formatMoney, monthLabel } from "./home-format";

export type HomeView =
	| { kind: "loading" }
	| { kind: "empty"; monthLabel: string }
	| {
			kind: "ready";
			monthLabel: string;
			totalAmountLabel: string;
			insight: string;
			categories: { name: string; amountLabel: string; muted: boolean }[];
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

export function useHomeView(): HomeView {
	const mock = activeHomeMock;
	const label = monthLabel(mock.month);

	if (mock.status === "loading") {
		return { kind: "loading" };
	}

	if (mock.documentCount === 0) {
		return { kind: "empty", monthLabel: label };
	}

	const { deductibles } = mock;

	return {
		kind: "ready",
		monthLabel: label,
		totalAmountLabel: formatMoney(mock.totalAmount),
		insight: mock.insight,
		categories: mock.categories.map(({ name, amount }) => ({
			name,
			amountLabel: formatMoney(amount),
			muted: name === "Otros",
		})),
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
