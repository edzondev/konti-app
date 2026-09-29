import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FieldJudge } from "./field-judge.js";
import { IngestionService } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

@Module({
	imports: [ConfigModule],
	providers: [IngestionService, OcrClient, FieldJudge],
	exports: [IngestionService],
})
export class IngestionModule {}
