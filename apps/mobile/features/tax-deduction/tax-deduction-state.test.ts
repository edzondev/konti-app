import { describe, expect, it } from "vitest";

import { deriveRequestedDeductionStatus } from "./tax-deduction-state";

describe("deduction client state", () => {
	it("keeps any unknown requirement potential", () => {
		expect(
			deriveRequestedDeductionStatus({
				verificationBasis: "user_confirmation",
				requirementStates: ["yes", "unknown", "yes"],
			}),
		).toBe("potential");
	});

	it("excludes a record with a known unmet requirement", () => {
		expect(
			deriveRequestedDeductionStatus({
				verificationBasis: "evidence_attached",
				requirementStates: ["yes", "no"],
			}),
		).toBe("excluded");
	});

	it("does not request inclusion while verification remains unresolved", () => {
		expect(
			deriveRequestedDeductionStatus({
				verificationBasis: "unresolved",
				requirementStates: ["yes", "yes"],
			}),
		).toBe("potential");
	});

	it("requests inclusion only with affirmative facts and user or evidence verification", () => {
		expect(
			deriveRequestedDeductionStatus({
				verificationBasis: "user_confirmation",
				requirementStates: ["yes", "yes"],
			}),
		).toBe("included");
	});
});
