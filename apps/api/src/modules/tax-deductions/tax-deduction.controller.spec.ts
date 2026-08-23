import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import type { Auth } from "../../auth/auth.factory";
import { TaxDeductionController } from "./tax-deduction.controller";
import type { TaxDeductionService } from "./tax-deduction.service";

jest.mock("better-auth/node", () => ({ fromNodeHeaders: (headers: unknown) => headers }));

const request = { headers: {} } as Request;
const valid = {
	category: "household_worker_essalud",
	paidAt: "2026-08-20",
	grossAmountPen: "100.00",
	verificationBasis: "user_confirmation",
	requestedCalculationStatus: "potential",
	requirements: [
		{ code: "worker_registration", status: "unknown" },
		{ code: "form_1676_evidence", status: "met" },
		{ code: "payment_recorded", status: "met" },
	],
	idempotencyKey: "22222222-2222-4222-8222-222222222222",
	sourceDocumentId: null,
	medical: null,
	fourthActivityType: null,
	rentAttribution: null,
};

describe("TaxDeductionController", () => {
	function createHarness() {
		const service = {
			createManual: jest.fn(async () => ({ record: { id: "deduction-1" } })),
		} as unknown as jest.Mocked<TaxDeductionService>;
		const auth = {
			api: { getSession: jest.fn(async () => ({ user: { id: "user-1" } })) },
		} as unknown as Auth;
		return { controller: new TaxDeductionController(service, auth), service };
	}

	it("parses and forwards a public deduction mutation", async () => {
		const { controller, service } = createHarness();

		await controller.create(request, valid);

		expect(service.createManual).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({
				grossAmountPen: "100.00",
				verificationBasis: "user_confirmation",
			}),
		);
	});

	it("rejects system_verified before the service boundary", async () => {
		const { controller, service } = createHarness();

		await expect(
			controller.create(request, { ...valid, verificationStatus: "system_verified" }),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(service.createManual).not.toHaveBeenCalled();
	});
});
