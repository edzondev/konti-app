import {
	BadRequestException,
	HttpException,
	HttpStatus,
	NotFoundException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { HttpExceptionFilter } from "./http-exception.filter.js";

function mockHost(statusSpy: ReturnType<typeof vi.fn>, jsonSpy: ReturnType<typeof vi.fn>) {
	return {
		switchToHttp: () => ({
			getResponse: () => ({
				status: statusSpy.mockReturnValue({ json: jsonSpy }),
			}),
		}),
	};
}

describe("HttpExceptionFilter", () => {
	it("serializa HttpException con body unificado", () => {
		const filter = new HttpExceptionFilter();
		const statusSpy = vi.fn();
		const jsonSpy = vi.fn();

		filter.catch(new NotFoundException("Document not found"), mockHost(statusSpy, jsonSpy) as never);

		expect(statusSpy).toHaveBeenCalledWith(404);
		expect(jsonSpy).toHaveBeenCalledWith({
			statusCode: 404,
			message: "Document not found",
			error: "Not Found",
		});
	});

	it("mapea 429", () => {
		const filter = new HttpExceptionFilter();
		const statusSpy = vi.fn();
		const jsonSpy = vi.fn();

		filter.catch(
			new HttpException("Too Many Requests", HttpStatus.TOO_MANY_REQUESTS),
			mockHost(statusSpy, jsonSpy) as never,
		);

		expect(statusSpy).toHaveBeenCalledWith(429);
		expect(jsonSpy).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 429, message: "Too Many Requests" }),
		);
	});

	it("oculta detalles en 500 en production", () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		const filter = new HttpExceptionFilter();
		const statusSpy = vi.fn();
		const jsonSpy = vi.fn();

		try {
			filter.catch(new Error("SELECT * FROM secret"), mockHost(statusSpy, jsonSpy) as never);
			expect(jsonSpy).toHaveBeenCalledWith({
				statusCode: 500,
				message: "Internal server error",
				error: "Internal Server Error",
			});
		} finally {
			process.env.NODE_ENV = prev;
		}
	});

	it("propaga BadRequestException", () => {
		const filter = new HttpExceptionFilter();
		const statusSpy = vi.fn();
		const jsonSpy = vi.fn();

		filter.catch(new BadRequestException("bad"), mockHost(statusSpy, jsonSpy) as never);
		expect(statusSpy).toHaveBeenCalledWith(400);
	});
});
