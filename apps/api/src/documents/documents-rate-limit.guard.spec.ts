import { ExecutionContext, HttpException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsRateLimitGuard } from "./documents-rate-limit.guard.js";

function contextFor(userId: string): ExecutionContext {
	return {
		switchToHttp: () => ({
			getRequest: () => ({ user: { id: userId } }),
		}),
	} as unknown as ExecutionContext;
}

describe("DocumentsRateLimitGuard", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("rechaza el hit 31 dentro de la hora y vuelve a permitir al abrir otra ventana", () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);

		const guard = new DocumentsRateLimitGuard();
		const context = contextFor("user-1");

		for (let hit = 0; hit < 30; hit++) {
			expect(guard.canActivate(context)).toBe(true);
		}

		expect(() => guard.canActivate(context)).toThrow(HttpException);
		try {
			guard.canActivate(context);
		} catch (error) {
			expect(error).toBeInstanceOf(HttpException);
			expect((error as HttpException).getStatus()).toBe(429);
		}

		vi.setSystemTime(60 * 60 * 1000 - 1);
		expect(() => guard.canActivate(context)).toThrow(HttpException);

		vi.setSystemTime(60 * 60 * 1000);
		expect(guard.canActivate(context)).toBe(true);
	});
});
