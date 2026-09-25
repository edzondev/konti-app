import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AuthGuard, type AuthedRequest } from "./auth.guard.js";

function mockContext(request: AuthedRequest) {
	return {
		switchToHttp: () => ({
			getRequest: () => request,
		}),
	} as ExecutionContext;
}

describe("AuthGuard", () => {
	it("attaches user and session.id to the request", async () => {
		const request = { headers: { cookie: "session=abc" } } as AuthedRequest;
		const auth = {
			api: {
				getSession: vi.fn().mockResolvedValue({
					user: { id: "u1", email: "a@b.c", name: "Alice" },
					session: { id: "s1" },
				}),
			},
		};
		const guard = new AuthGuard(auth as never);

		await expect(guard.canActivate(mockContext(request))).resolves.toBe(true);
		expect(auth.api.getSession).toHaveBeenCalledWith({ headers: request.headers });
		expect(request.user).toEqual({ id: "u1", email: "a@b.c", name: "Alice" });
		expect(request.session).toEqual({ id: "s1" });
	});

	it("throws UnauthorizedException when getSession returns null", async () => {
		const request = { headers: {} } as AuthedRequest;
		const auth = {
			api: {
				getSession: vi.fn().mockResolvedValue(null),
			},
		};
		const guard = new AuthGuard(auth as never);

		await expect(guard.canActivate(mockContext(request))).rejects.toThrow(UnauthorizedException);
	});
});
