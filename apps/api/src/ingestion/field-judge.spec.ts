import type { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../config/env.js";
import { FieldJudge } from "./field-judge.js";

describe("FieldJudge", () => {
	const config = {
		getOrThrow: vi.fn().mockReturnValue("test-key"),
		get: vi.fn().mockReturnValue(5_000),
	} as unknown as ConfigService<Env, true>;

	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					answers: {
						total: { choice: "60.00", confidence: 0.9 },
						issuer: { choice: "COMERCIO SAC", confidence: 0.8 },
					},
				}),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("pide a TypeSafe y arma el extracto", async () => {
		const judge = new FieldJudge(config);
		const result = await judge.pick("COMERCIO SAC\nTOTAL 60.00");

		expect(result.confident).toBe(true);
		expect(result.extracted.totalAmount).toBe("60.00");
		expect(result.extracted.issuerName).toBe("COMERCIO SAC");
		expect(fetch).toHaveBeenCalledOnce();
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.model).toBe("jev-1.13.0");
	});

	it("sin montos no llama a TypeSafe", async () => {
		const judge = new FieldJudge(config);
		const result = await judge.pick("sin montos");
		expect(result.confident).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});
});
