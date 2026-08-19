import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { HomeResponse } from "./home.types";

@Injectable()
export class HomeService {
	constructor(
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
	) {}

	async getCurrentHome(userId: string): Promise<HomeResponse> {
		const current = await this.taxProfileService.getCurrentUser(userId);

		if (current.requiresOnboarding) {
			throw new HttpException(
				{
					code: "PROFILE_INCOMPLETE",
					message: "Completa tu perfil tributario antes de ver el inicio.",
				},
				HttpStatus.CONFLICT,
			);
		}

		return {
			status: "up_to_date",
			taxYear: current.taxYear,
			primary: {
				code: "NOTHING_TO_REVIEW",
				title: "Aún no hay nada que revisar.",
				description: "Cuando llegue tu primer comprobante, Konti empieza a trabajar.",
				action: null,
			},
			attention: { count: 0, nextItem: null },
			summary: {
				processedDocuments: 0,
				processingDocuments: 0,
				potentiallyRelevantAmount: null,
			},
			nextRelevantEvent: null,
			updatedAt: new Date().toISOString(),
		};
	}
}
