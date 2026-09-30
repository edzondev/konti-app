import * as Sentry from "@sentry/react-native";

import { scrubSentryEvent } from "@/core/sentry-scrub";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (dsn) {
	Sentry.init({
		dsn,
		sendDefaultPii: false,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
		beforeSend(event) {
			return scrubSentryEvent(event);
		},
	});
}
