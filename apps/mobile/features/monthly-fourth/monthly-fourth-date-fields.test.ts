import { describe, expect, it } from "vitest";

import {
	monthlyFourthDateLimits,
	reconcileRestartDate,
	restartDateLimits,
} from "./monthly-fourth-date-fields";

describe("monthly fourth calendar limits", () => {
	it("uses the current civil day in Lima without exposing a future UTC day", () => {
		const limits = monthlyFourthDateLimits(new Date("2026-08-24T04:30:00.000Z"));

		expect(limits.today).toBe("2026-08-23");
		expect(limits.suspensionMaximumDate).toBe("2026-08-23");
		expect(limits.occurredFactMaximumDate).toBe("2026-08-23");
	});

	it("caps suspension dates in 2026 while later occurred facts may use a later year", () => {
		const limits = monthlyFourthDateLimits(new Date("2027-02-01T17:00:00.000Z"));

		expect(limits.suspensionMaximumDate).toBe("2026-12-31");
		expect(limits.occurredFactMaximumDate).toBe("2027-02-01");
	});

	it("starts restart selection on the civil day after authorization", () => {
		expect(restartDateLimits("2026-01-31", "2026-08-23")).toEqual({
			effectiveMinimumDate: "2026-02-01",
			minimumDate: "2026-02-01",
			maximumDate: "2026-08-23",
			hasSelectableDate: true,
		});
	});

	it("keeps an empty restart blank and clears a previous date before the new minimum", () => {
		expect(reconcileRestartDate("", "2026-02-11", "2026-08-23")).toBe("");
		expect(reconcileRestartDate("2026-02-10", "2026-02-11", "2026-08-23")).toBe("");
		expect(reconcileRestartDate("2026-02-12", "2026-02-11", "2026-08-23")).toBe("2026-02-12");
	});

	it("does not expose an invalid picker range when no later 2026 day has occurred", () => {
		expect(restartDateLimits("2026-08-23", "2026-08-23")).toEqual({
			effectiveMinimumDate: "2026-08-24",
			minimumDate: "2026-08-23",
			maximumDate: "2026-08-23",
			hasSelectableDate: false,
		});
	});
});
