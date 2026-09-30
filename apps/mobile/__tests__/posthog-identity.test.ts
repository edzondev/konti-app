import { afterEach, describe, expect, it, vi } from "vitest";

import {
	posthogTracingHeaders,
	setPostHogTracingClient,
	syncPostHogUser,
} from "@/core/posthog-identity";

afterEach(() => {
	setPostHogTracingClient(null);
});

describe("syncPostHogUser", () => {
	it("identifies with the user id only", () => {
		const identify = vi.fn();
		const reset = vi.fn();

		syncPostHogUser({ identify, reset }, "user-1");

		expect(identify).toHaveBeenCalledTimes(1);
		expect(identify.mock.calls[0]).toEqual(["user-1"]);
		expect(reset).not.toHaveBeenCalled();
	});

	it("resets when there is no user", () => {
		const identify = vi.fn();
		const reset = vi.fn();

		syncPostHogUser({ identify, reset }, null);

		expect(reset).toHaveBeenCalledTimes(1);
		expect(identify).not.toHaveBeenCalled();
	});

	it("does nothing when PostHog is not configured", () => {
		expect(() => syncPostHogUser(null, "user-1")).not.toThrow();
	});
});

describe("posthogTracingHeaders", () => {
	it("sends the distinct id and session id", () => {
		setPostHogTracingClient({
			getDistinctId: () => "user-1",
			getSessionId: () => "sess-1",
		});

		expect(posthogTracingHeaders()).toEqual({
			"x-posthog-distinct-id": "user-1",
			"x-posthog-session-id": "sess-1",
		});
	});

	it("omits a blank id", () => {
		setPostHogTracingClient({
			getDistinctId: () => "  ",
			getSessionId: () => "sess-1",
		});

		expect(posthogTracingHeaders()).toEqual({
			"x-posthog-session-id": "sess-1",
		});
	});

	it("sends nothing when PostHog is not configured", () => {
		expect(posthogTracingHeaders()).toEqual({});
	});
});
