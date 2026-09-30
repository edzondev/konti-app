import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "./sentry-scrub.js";

describe("scrubSentryEvent", () => {
	it("drops identity, request bodies, and financial fields", () => {
		const event = scrubSentryEvent({
			user: { id: "user-1", email: "ada@example.com", username: "Ada", ip_address: "1.1.1.1" },
			request: {
				url: "/documents",
				method: "POST",
				data: { totalAmount: "10.00", issuerName: "Wong" },
				cookies: { session: "abc" },
				headers: { authorization: "Bearer secret" },
				query_string: "q=1",
			},
			extra: { totalAmount: "10.00", issuerName: "Wong", source: "qr" },
			exception: { values: [{ type: "Error", value: '{"issuerName":"Wong","totalAmount":"10"}' }] },
		});

		expect(event.user).toEqual({ id: "user-1" });
		expect(event.request).toEqual({ url: "/documents", method: "POST" });
		expect(event.extra).toEqual({ source: "qr" });
		expect(event.exception?.values?.[0]?.value).toBe("redacted");
	});

	it("keeps a plain error message", () => {
		const event = scrubSentryEvent({
			exception: { values: [{ type: "Error", value: "ocr down" }] },
		});

		expect(event.exception?.values?.[0]?.value).toBe("ocr down");
	});
});
