import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { TaxPeriodController } from "./tax-period.controller";

jest.mock("better-auth/node", () => ({ fromNodeHeaders: (headers: unknown) => headers }));

const request = { headers: {} } as Request;
const period = {
	period: "2026-01",
	status: "awaiting_user_confirmation",
} as const;

function createHarness(session: { user: { id: string } } | null = { user: { id: "user-1" } }) {
	const service = {
		getPeriod: jest.fn(async () => period),
		updatePeriod: jest.fn(async () => period),
		reviewPeriod: jest.fn(async () => ({ period, taxStatus: { status: "calculated" } })),
		recordSuspension: jest.fn(async () => period),
		recordFiling: jest.fn(async () => period),
		recordPayment: jest.fn(async () => period),
	};
	const auth = { api: { getSession: jest.fn(async () => session) } };
	return {
		controller: new TaxPeriodController(service as never, auth as never),
		service,
	};
}

describe("TaxPeriodController", () => {
	it("returns the period resource directly for the authenticated user", async () => {
		const { controller, service } = createHarness();

		await expect(controller.getPeriod(request, "2026-01")).resolves.toBe(period);
		expect(service.getPeriod).toHaveBeenCalledWith("user-1", "2026-01");
	});

	it("keeps declaration and payment on different endpoints", async () => {
		const { controller, service } = createHarness();
		const filing = {
			period: "2026-01",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
			answer: "no",
			filedAt: null,
			confirmationNumber: null,
		};
		const payment = {
			period: "2026-01",
			idempotencyKey: "33333333-3333-4333-8333-333333333333",
			answer: "unknown",
			amountPen: null,
			paidAt: null,
			confirmationCode: null,
		};

		await controller.recordFiling(request, filing);
		await controller.recordPayment(request, payment);

		expect(service.recordFiling).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({ answer: "no", verificationScope: "user_provided" }),
		);
		expect(service.recordPayment).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({ answer: "unknown", verificationScope: "user_provided" }),
		);
	});

	it("forwards one atomic review command and returns period plus tax status", async () => {
		const { controller, service } = createHarness();
		const body = {
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
			coverage: "complete",
			activityClassification: "ordinary",
			suspension: null,
			filing: { answer: "no", filedAt: null, confirmationNumber: null },
			payment: { answer: "no", amountPen: null, paidAt: null, confirmationCode: null },
		};

		await expect(controller.reviewPeriod(request, "2026-01", body)).resolves.toEqual({
			period,
			taxStatus: { status: "calculated" },
		});
		expect(service.reviewPeriod).toHaveBeenCalledWith(
			"user-1",
			"2026-01",
			expect.objectContaining({ idempotencyKey: body.idempotencyKey }),
		);
	});

	it("rejects public attempts to claim official verification", async () => {
		const { controller } = createHarness();

		await expect(
			controller.recordFiling(request, {
				period: "2026-01",
				idempotencyKey: "22222222-2222-4222-8222-222222222222",
				answer: "yes",
				filedAt: "2026-02-10",
				confirmationNumber: null,
				verificationScope: "system_verified",
				sourceDocumentId: null,
			}),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("requires a valid session", async () => {
		const { controller } = createHarness(null);

		await expect(controller.getPeriod(request, "2026-01")).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});
});
