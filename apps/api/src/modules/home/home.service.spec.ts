import { HttpStatus } from "@nestjs/common";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { HomeService } from "./home.service";

describe("HomeService", () => {
	const taxProfileService = {
		getCurrentUser: jest.fn(),
	};

	const service = new HomeService(taxProfileService as unknown as TaxProfileService);

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

	it("returns NOTHING_TO_REVIEW when the profile is complete", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { status: "complete" },
		});

		const result = await service.getCurrentHome("user-1");

		expect(result.status).toBe("up_to_date");
		expect(result.taxYear).toBe(2026);
		expect(result.primary.code).toBe("NOTHING_TO_REVIEW");
		expect(result.primary.action).toBeNull();
		expect(result.attention).toEqual({ count: 0, nextItem: null });
		expect(result.summary.processedDocuments).toBe(0);
	});
});
