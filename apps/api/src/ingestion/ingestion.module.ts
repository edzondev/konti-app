import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { IngestionService } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

@Module({
	imports: [ConfigModule],
	providers: [IngestionService, OcrClient],
	exports: [IngestionService],
})
export class IngestionModule {}
