import { describe, expect, it } from "vitest";

import { recordsWithFocusedIncome } from "./tax-income-focus";
import type { TaxIncomeRecord } from "./types";

const record = (id: string, incomeType: TaxIncomeRecord["incomeType"] = "employment") =>
	({ id, incomeType }) as TaxIncomeRecord;

describe("recordsWithFocusedIncome", () => {
	it("places a detail-fetched target first when it is outside loaded pages", () => {
		expect(
			recordsWithFocusedIncome([record("loaded")], record("target"), "target", "employment").map(
				(item) => item.id,
			),
		).toEqual(["target", "loaded"]);
	});

	it("moves an already loaded target first without duplicating it", () => {
		expect(
			recordsWithFocusedIncome(
				[record("first"), record("target")],
				record("target"),
				"target",
				"employment",
			).map((item) => item.id),
		).toEqual(["target", "first"]);
	});

	it("does not inject a focused record into an incompatible filter", () => {
		expect(recordsWithFocusedIncome([], record("target"), "target", "fourth")).toEqual([]);
	});
});
