import { describe, expect, it } from "vitest";

import { shouldClearQueryCache } from "./query-session-lifecycle";

describe("shouldClearQueryCache", () => {
	it.each([
		["user-a", undefined, true],
		["user-a", "user-b", true],
		["user-a", "user-a", false],
		[undefined, "user-a", false],
		[undefined, undefined, false],
	] as const)("handles %s -> %s", (previousUserId, nextUserId, expected) => {
		expect(shouldClearQueryCache(previousUserId, nextUserId)).toBe(expected);
	});
});
