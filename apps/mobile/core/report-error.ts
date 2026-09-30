import * as Sentry from "@sentry/react-native";

export function reportError(message: string, error?: unknown): void {
	console.error(message, error);
	if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
	if (error instanceof Error) Sentry.captureException(error);
	else Sentry.captureMessage(message);
}
