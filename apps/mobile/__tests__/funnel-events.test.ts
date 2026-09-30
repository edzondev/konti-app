import { describe, expect, it, vi } from "vitest";

import { trackCaptureLeave, trackFeature, trackView } from "@/core/funnel-events";

function client() {
	return { capture: vi.fn() };
}

describe("trackView", () => {
	it("sends home_viewed with no properties", () => {
		const posthog = client();
		trackView(posthog, "home_viewed");
		expect(posthog.capture.mock.calls).toEqual([["home_viewed"]]);
	});

	it("sends capture_opened with no properties", () => {
		const posthog = client();
		trackView(posthog, "capture_opened");
		expect(posthog.capture.mock.calls).toEqual([["capture_opened"]]);
	});

	it("does nothing when PostHog is not configured", () => {
		expect(() => trackView(null, "home_viewed")).not.toThrow();
	});
});

describe("trackFeature", () => {
	it.each([
		"deductions_sheet_opened",
		"deductions_year_viewed",
		"document_edited",
		"export_requested",
		"sign_out",
	] as const)("sends %s with no properties", (event) => {
		const posthog = client();
		trackFeature(posthog, event);
		expect(posthog.capture.mock.calls).toEqual([[event]]);
	});

	it("does nothing when PostHog is not configured", () => {
		expect(() => trackFeature(null, "export_requested")).not.toThrow();
	});
});

describe("trackCaptureLeave", () => {
	it("sends time on screen when the visit uploaded nothing", () => {
		const posthog = client();
		trackCaptureLeave(posthog, {
			openedAt: 1_000,
			leftAt: 4_500,
			uploaded: false,
			busy: false,
		});
		expect(posthog.capture.mock.calls).toEqual([
			["capture_abandoned", { time_in_screen_ms: 3_500 }],
		]);
	});

	it("stays quiet after a successful upload", () => {
		const posthog = client();
		trackCaptureLeave(posthog, {
			openedAt: 1_000,
			leftAt: 4_500,
			uploaded: true,
			busy: false,
		});
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it("waits while an upload is still in flight", () => {
		const posthog = client();
		trackCaptureLeave(posthog, {
			openedAt: 1_000,
			leftAt: 4_500,
			uploaded: false,
			busy: true,
		});
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it("clamps a backwards clock to zero", () => {
		const posthog = client();
		trackCaptureLeave(posthog, {
			openedAt: 5_000,
			leftAt: 1_000,
			uploaded: false,
			busy: false,
		});
		expect(posthog.capture).toHaveBeenCalledWith("capture_abandoned", { time_in_screen_ms: 0 });
	});
});
