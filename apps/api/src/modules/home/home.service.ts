import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { DocumentsService } from "../documents/documents.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { HomeResponse } from "./home.types";

@Injectable()
export class HomeService {
	constructor(
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
		@Inject(DocumentsService)
		private readonly documentsService: DocumentsService,
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

		const processedDocuments = await this.documentsService.countUploaded(userId);
		const hasUploadedDocuments = processedDocuments > 0;

		return {
			status: "up_to_date",
			taxYear: current.taxYear,
			primary: {
				code: hasUploadedDocuments ? "NOTHING_TO_REVIEW" : "ADD_FIRST_DOCUMENT",
				title: hasUploadedDocuments
					? "Aún no hay nada que revisar."
					: "Añade tu primer comprobante",
				description: "Cuando llegue tu primer comprobante, Konti empieza a trabajar.",
				action: hasUploadedDocuments ? null : "open_capture",
			},
			attention: { count: 0, nextItem: null },
			summary: {
				processedDocuments,
				processingDocuments: 0,
				potentiallyRelevantAmount: null,
			},
			nextRelevantEvent: null,
			updatedAt: new Date().toISOString(),
		};
	}
}
