import {
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { AuthedRequest } from "../auth/auth.guard.js";

const LIMIT = 20;
const WINDOW_MS = 60_000;

interface WindowEntry {
	count: number;
	resetAt: number;
}

/**
 * Rate limit in-memory por userId. Solo para POST /documents.
 * Sin Redis: válido para V1 (~10 usuarios, un proceso).
 */
@Injectable()
export class DocumentsRateLimitGuard implements CanActivate {
	private readonly hits = new Map<string, WindowEntry>();

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<AuthedRequest>();
		const userId = request.user?.id;
		if (!userId) throw new UnauthorizedException();

		const now = Date.now();
		this.pruneExpired(now);

		let entry = this.hits.get(userId);
		if (!entry || now >= entry.resetAt) {
			entry = { count: 0, resetAt: now + WINDOW_MS };
			this.hits.set(userId, entry);
		}

		entry.count += 1;

		if (entry.count > LIMIT) {
			throw new HttpException("Too Many Requests", HttpStatus.TOO_MANY_REQUESTS);
		}

		return true;
	}

	private pruneExpired(now: number): void {
		for (const [key, entry] of this.hits) {
			if (now >= entry.resetAt) {
				this.hits.delete(key);
			}
		}
	}
}
