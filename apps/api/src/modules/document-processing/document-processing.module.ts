import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageModule } from "../../core/storage/storage.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { DocumentProcessingRepository } from "./document-processing.repository";
import { DocumentProcessingService } from "./document-processing.service";
import { FakeOcrProvider } from "./fake-ocr.provider";
import { MistralOcrProvider } from "./mistral-ocr.provider";
import { OCR_PROVIDER } from "./ocr.constants";

@Module({
	imports: [DatabaseModule, StorageModule, TaxProfileModule],
	providers: [
		DocumentProcessingRepository,
		DocumentProcessingService,
		{
			provide: OCR_PROVIDER,
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const name = config.get<string>("OCR_PROVIDER") ?? "mistral";
				if (name === "fake") {
					return new FakeOcrProvider();
				}
				if (name === "mistral") {
					const apiKey = config.get<string>("MISTRAL_API_KEY");
					if (!apiKey) {
						throw new Error("Missing MISTRAL_API_KEY");
					}
					return new MistralOcrProvider(config);
				}
				throw new Error(`Unknown OCR_PROVIDER: ${name}`);
			},
		},
	],
	exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
