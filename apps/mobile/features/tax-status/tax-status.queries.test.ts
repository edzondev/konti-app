import { describe, expect, it } from "vitest";

import { taxStatusKeys } from "./tax-status.keys";

describe("tax status query ownership", () => {
	it("includes the authenticated user in current and historical cache keys", () => {
		expect(taxStatusKeys.current("user-a")).toEqual(["tax-status", "user-a", "current"]);
		expect(taxStatusKeys.evaluation("user-a", "evaluation-1")).toEqual([
			"tax-status",
			"user-a",
			"evaluation",
			"evaluation-1",
		]);
		expect(taxStatusKeys.current("user-b")).not.toEqual(taxStatusKeys.current("user-a"));
		expect(taxStatusKeys.evaluation("user-b", "evaluation-1")).not.toEqual(
			taxStatusKeys.evaluation("user-a", "evaluation-1"),
		);
	});
});
