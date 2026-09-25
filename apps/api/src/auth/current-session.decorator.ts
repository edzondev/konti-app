import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthedRequest, AuthSession } from "./auth.guard.js";

export const CurrentSession = createParamDecorator(
	(_: unknown, ctx: ExecutionContext): AuthSession => {
		const request = ctx.switchToHttp().getRequest<AuthedRequest>();
		return request.session;
	},
);
