import { existsSync } from "node:fs";
import { resolve } from "node:path";
import * as Sentry from "@sentry/nestjs";
import { scrubSentryEvent } from "./sentry/sentry-scrub.js";

const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) {
	process.loadEnvFile(envFile);
}

const dsn = process.env.SENTRY_DSN;
if (dsn) {
	Sentry.init({
		dsn,
		tracesSampleRate: 0.1,
		beforeSend(event) {
			return scrubSentryEvent(event);
		},
	});
}
