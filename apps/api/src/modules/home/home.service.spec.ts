import { HttpStatus } from "@nestjs/common";
import type { DocumentsService } from "../documents/documents.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { HomeService } from "./home.service";

describe("HomeService", () => {
	const taxProfileService = {
		getCurrentUser: jest.fn(),
	};
	const documentsService = {
		countVisible: jest.fn(),
	};

	const service = new HomeService(
		taxProfileService as unknown as TaxProfileService,
		documentsService as unknown as DocumentsService,
	);

	it("throws PROFILE_INCOMPLETE when onboarding is required", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: true,
			profile: null,
		});

		await expect(service.getCurrentHome("user-1")).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: {
				code: "PROFILE_INCOMPLETE",
			},
		});
	});

	it("returns ADD_FIRST_DOCUMENT with capture CTA when no documents are uploaded", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { status: "complete" },
		});
		documentsService.countVisible.mockResolvedValue(0);

		const result = await service.getCurrentHome("user-1");

		expect(result.status).toBe("up_to_date");
		expect(result.taxYear).toBe(2026);
		expect(result.primary).toEqual({
			code: "ADD_FIRST_DOCUMENT",
			title: "Añade tu primer comprobante",
			description: "Cuando llegue tu primer comprobante, Konti empieza a trabajar.",
			action: "open_capture",
		});
		expect(result.attention).toEqual({ count: 0, nextItem: null });
		expect(result.summary.processedDocuments).toBe(0);
	});

	it("returns NOTHING_TO_REVIEW once a visible ready document exists", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { status: "complete" },
		});
		documentsService.countVisible.mockResolvedValue(1);

		const result = await service.getCurrentHome("user-1");

		expect(result.primary.code).toBe("NOTHING_TO_REVIEW");
		expect(result.primary.action).toBeNull();
		expect(result.summary.processedDocuments).toBe(1);
	});
});
