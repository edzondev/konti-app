import { beforeEach, describe, expect, it, vi } from "vitest";

const getCookie = vi.fn();

vi.mock("@/core/auth-client", () => ({
	authClient: { getCookie },
}));

describe("apiFetch", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.stubEnv("EXPO_PUBLIC_API_URL", "http://localhost:3000");
		getCookie.mockReset();
		getCookie.mockResolvedValue("better-auth.session_token=abc");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify([{ id: "1" }]), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			),
		);
	});

	it("sends Cookie header and omits credentials", async () => {
		const { apiFetch } = await import("../core/api-fetch.js");
		await apiFetch("/documents");
		expect(fetch).toHaveBeenCalledWith(
			"http://localhost:3000/documents",
			expect.objectContaining({
				credentials: "omit",
				headers: expect.any(Headers),
			}),
		);
		const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
		expect(new Headers(init.headers).get("Cookie")).toBe("better-auth.session_token=abc");
	});

	it("throws ApiError on 401", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
		);
		const { apiFetch, ApiError } = await import("../core/api-fetch.js");
		await expect(apiFetch("/documents")).rejects.toBeInstanceOf(ApiError);
	});

	it("does not parse body when Content-Type is not JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response("ok", {
					status: 200,
					headers: { "Content-Type": "text/plain" },
				}),
			),
		);
		const { apiFetch } = await import("../core/api-fetch.js");
		await expect(apiFetch("/documents")).resolves.toBeUndefined();
	});
});
