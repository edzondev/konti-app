export type PostHogClientConfig = {
	apiKey: string;
	options: {
		host: string;
		captureAppLifecycleEvents: true;
		enableSessionReplay: false;
	};
	autocapture: {
		captureScreens: false;
	};
};

/** Null when the project key is absent, so the app still boots. */
export function posthogClientConfig(): PostHogClientConfig | null {
	const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
	if (!apiKey) return null;

	const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

	return {
		apiKey,
		options: {
			host,
			captureAppLifecycleEvents: true,
			enableSessionReplay: false,
		},
		autocapture: { captureScreens: false },
	};
}
