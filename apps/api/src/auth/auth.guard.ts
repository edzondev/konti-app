import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AUTH } from "./auth.constants.js";
import type { Auth } from "./auth.factory.js";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
}

export interface AuthSession {
	id: string;
}

export interface AuthedRequest extends Request {
	user: AuthUser;
	session: AuthSession;
}

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthedRequest>();
		const session = await this.auth.api.getSession({ headers: request.headers });

		if (!session) throw new UnauthorizedException();

		request.user = session.user;
		request.session = { id: session.session.id };
		return true;
	}
}
