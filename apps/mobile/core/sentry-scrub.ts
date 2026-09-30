const SENSITIVE_KEY =
	/email|amount|issuer|merchant|comercio|ruc|tax|payload|token|authorization|password|secret|^qr$/i;

type SentryScrubEvent = {
	user?: {
		email?: unknown;
		username?: unknown;
		ip_address?: unknown;
	} | null;
	request?: {
		data?: unknown;
		cookies?: unknown;
		headers?: unknown;
		query_string?: unknown;
	} | null;
	extra?: Record<string, unknown> | null;
	exception?: { values?: Array<{ value?: string }> } | null;
};

export function scrubSentryEvent<T extends SentryScrubEvent>(event: T): T {
	if (event.user) {
		delete event.user.email;
		delete event.user.username;
		delete event.user.ip_address;
	}
	if (event.request) {
		delete event.request.data;
		delete event.request.cookies;
		delete event.request.headers;
		delete event.request.query_string;
	}
	if (event.extra) event.extra = scrubRecord(event.extra);
	for (const value of event.exception?.values ?? []) {
		if (value.value) value.value = scrubText(value.value);
	}
	return event;
}

function scrubText(value: string): string {
	const trimmed = value.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[") || value.includes("@")) return "redacted";
	return value;
}

function scrubRecord(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(record)) {
		if (SENSITIVE_KEY.test(key)) continue;
		out[key] = typeof value === "string" ? scrubText(value) : value;
	}
	return out;
}
