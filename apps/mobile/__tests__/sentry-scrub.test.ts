import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "@/core/sentry-scrub";

describe("scrubSentryEvent", () => {
	it("drops identity, request bodies, and financial fields", () => {
		const event = scrubSentryEvent({
			user: { id: "user-1", email: "ada@example.com", username: "Ada", ip_address: "1.1.1.1" },
			request: {
				url: "/me/export",
				method: "GET",
				data: { documents: [{ issuerName: "Wong" }] },
				cookies: { session: "abc" },
				headers: { cookie: "session=abc" },
			},
			extra: { email: "ada@example.com", step: "export" },
			exception: { values: [{ type: "Error", value: "ada@example.com" }] },
		});

		expect(event.user).toEqual({ id: "user-1" });
		expect(event.request).toEqual({ url: "/me/export", method: "GET" });
		expect(event.extra).toEqual({ step: "export" });
		expect(event.exception?.values?.[0]?.value).toBe("redacted");
	});
});
