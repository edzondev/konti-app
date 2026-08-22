import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
	getCookie: vi.fn<() => Promise<string>>(),
}));

vi.mock("@/core/auth-client", () => ({
	authClient: auth,
}));

let apiClient: typeof import("../../core/api-client.js")["apiClient"];

beforeAll(async () => {
	vi.stubEnv("EXPO_PUBLIC_API_URL", "http://127.0.0.1:3000");
	({ apiClient } = await import("../../core/api-client.js"));
});

beforeEach(() => {
	auth.getCookie.mockReset();
	vi.restoreAllMocks();
});

describe("apiClient authentication", () => {
	it("awaits the Expo cookie before adding it to an authenticated request", async () => {
		auth.getCookie.mockResolvedValue("better-auth.session_token=session-value");
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await apiClient<{ ok: boolean }>("/v1/tax-profile/current");

		const request = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
		expect(new Headers(request?.headers).get("Cookie")).toBe(
			"better-auth.session_token=session-value",
		);
	});
});
