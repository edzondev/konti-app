import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthedRequest, AuthUser } from "./auth.guard.js";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
	const request = ctx.switchToHttp().getRequest<AuthedRequest>();
	return request.user;
});
