import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<{ method?: string; url?: string }>();
		const where = `${request?.method ?? "?"} ${request?.url ?? "?"}`;
		const isProd = process.env.NODE_ENV === "production";

		if (exception instanceof HttpException) {
			const statusCode = exception.getStatus();
			const raw = exception.getResponse();
			const message =
				typeof raw === "string"
					? raw
					: typeof raw === "object" && raw !== null && "message" in raw
						? (raw as { message: string | string[] }).message
						: exception.message;
			const detail = Array.isArray(message) ? message.join("; ") : message;

			this.logger.warn(`${where} ${statusCode} ${detail}`);

			response.status(statusCode).json({
				statusCode,
				message,
				error: httpErrorName(statusCode),
			});
			return;
		}

		this.logger.error(
			`${where} unhandled`,
			exception instanceof Error ? exception.stack : undefined,
		);

		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: isProd
				? "Internal server error"
				: exception instanceof Error
					? exception.message
					: "Internal server error",
			error: "Internal Server Error",
		});
	}
}

function httpErrorName(statusCode: number): string {
	const name = HttpStatus[statusCode];
	if (typeof name === "string") {
		return name
			.split("_")
			.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
			.join(" ");
	}
	return "Error";
}
