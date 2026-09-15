import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module.js";
import { IngestionService } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

@Module({
	imports: [ConfigModule, DatabaseModule],
	providers: [IngestionService, OcrClient],
	exports: [IngestionService],
})
export class IngestionModule {}
