type PostHogUserClient = {
	identify: (distinctId: string) => void;
	reset: () => void;
};

type PostHogTracingClient = {
	getDistinctId: () => string;
	getSessionId: () => string;
};

let tracingClient: PostHogTracingClient | null = null;

/** Same PostHog instance the provider uses, so API calls join that session. */
export function setPostHogTracingClient(client: PostHogTracingClient | null): void {
	tracingClient = client;
}

export function syncPostHogUser(
	client: PostHogUserClient | null | undefined,
	userId: string | null,
): void {
	if (!client) return;
	const id = userId?.trim();
	if (id) client.identify(id);
	else client.reset();
}

export function posthogTracingHeaders(): Record<string, string> {
	if (!tracingClient) return {};

	const headers: Record<string, string> = {};
	const distinctId = tracingClient.getDistinctId().trim();
	const sessionId = tracingClient.getSessionId().trim();
	if (distinctId) headers["x-posthog-distinct-id"] = distinctId;
	if (sessionId) headers["x-posthog-session-id"] = sessionId;
	return headers;
}
