import { describe, expect, it } from "vitest";
import {
	toDeductionSheetList,
	type DeductiblesInput,
} from "@/features/deductions/deductions-sheet-list";

function doc(id: string, totalAmount: string | null, issuerName: string | null = null) {
	return { id, issuerName, totalAmount };
}

function deductibles(partial: Partial<DeductiblesInput> & Pick<DeductiblesInput, "count">): DeductiblesInput {
	return {
		totalAmount: 0,
		categoryNames: [],
		items: [],
		...partial,
	};
}

describe("toDeductionSheetList", () => {
	it("returns empty variant when count is 0", () => {
		const result = toDeductionSheetList(
			deductibles({ count: 0, totalAmount: 0, categoryNames: [], items: [] }),
		);

		expect(result).toEqual({
			variant: "empty",
			groups: [],
			moreCount: 0,
			totalAmount: 0,
			count: 0,
		});
	});

	it("returns full variant with all docs when count is exactly 5", () => {
		const items = [
			{
				categoryName: "Salud",
				documents: [
					doc("1", "100"),
					doc("2", "90"),
					doc("3", "80"),
					doc("4", "70"),
					doc("5", "60"),
				],
			},
		];

		const result = toDeductionSheetList(
			deductibles({
				count: 5,
				totalAmount: 400,
				categoryNames: ["Salud"],
				items,
			}),
		);

		expect(result.variant).toBe("full");
		expect(result.moreCount).toBe(0);
		expect(result.count).toBe(5);
		expect(result.totalAmount).toBe(400);
		expect(result.groups.flatMap((g) => g.documents)).toHaveLength(5);
	});

	it("returns many variant with top 5 and moreCount 1 when count is 6", () => {
		const items = [
			{
				categoryName: "Salud",
				documents: [
					doc("1", "100"),
					doc("2", "90"),
					doc("3", "80"),
					doc("4", "70"),
					doc("5", "60"),
					doc("6", "50"),
				],
			},
		];

		const result = toDeductionSheetList(
			deductibles({
				count: 6,
				totalAmount: 450,
				categoryNames: ["Salud"],
				items,
			}),
		);

		expect(result.variant).toBe("many");
		expect(result.moreCount).toBe(1);
		expect(result.count).toBe(6);
		expect(result.groups.flatMap((g) => g.documents)).toHaveLength(5);
		expect(result.groups[0]!.documents.map((d) => d.id)).toEqual([
			"1",
			"2",
			"3",
			"4",
			"5",
		]);
	});

	it("orders categories by full-month totals and docs by amount among top 5", () => {
		// Category totals (all docs): B = 200+10 = 210, A = 150+40+30 = 220 → A first
		// Top 5 globally by amount: A150, B200, A40, A30, B10 → drop nothing? wait 5 docs total
		// Need 6+ for truncation. Add a small C doc that gets dropped.
		const items = [
			{
				categoryName: "B",
				documents: [doc("b1", "200"), doc("b2", "10")],
			},
			{
				categoryName: "A",
				documents: [doc("a1", "150"), doc("a2", "40"), doc("a3", "30")],
			},
			{
				categoryName: "C",
				documents: [doc("c1", "5")],
			},
		];
		// Full-month totals: A=220, B=210, C=5 → category order A, B (, C if visible)
		// Top 5 by amount: b1(200), a1(150), a2(40), a3(30), b2(10) — c1(5) dropped
		// Groups: A [a1, a2, a3], B [b1, b2]

		const result = toDeductionSheetList(
			deductibles({
				count: 6,
				totalAmount: 435,
				categoryNames: ["B", "A", "C"],
				items,
			}),
		);

		expect(result.variant).toBe("many");
		expect(result.moreCount).toBe(1);
		expect(result.groups.map((g) => g.categoryName)).toEqual(["A", "B"]);
		expect(result.groups[0]!.documents.map((d) => d.id)).toEqual(["a1", "a2", "a3"]);
		expect(result.groups[1]!.documents.map((d) => d.id)).toEqual(["b1", "b2"]);
	});
});
