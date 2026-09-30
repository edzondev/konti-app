import { afterEach, describe, expect, it } from "vitest";

import { posthogClientConfig } from "@/core/posthog-config";

afterEach(() => {
	delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
	delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
});

describe("posthogClientConfig", () => {
	it("returns null when the api key is missing", () => {
		delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
		expect(posthogClientConfig()).toBeNull();
	});

	it("returns null when the api key is blank", () => {
		process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "   ";
		expect(posthogClientConfig()).toBeNull();
	});

	it("enables lifecycle events and disables replay and screen capture", () => {
		process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "phc_test";
		expect(posthogClientConfig()).toEqual({
			apiKey: "phc_test",
			options: {
				host: "https://us.i.posthog.com",
				captureAppLifecycleEvents: true,
				enableSessionReplay: false,
			},
			autocapture: { captureScreens: false },
		});
	});

	it("uses EXPO_PUBLIC_POSTHOG_HOST when set", () => {
		process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "phc_test";
		process.env.EXPO_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
		expect(posthogClientConfig()?.options.host).toBe("https://eu.i.posthog.com");
	});
});
