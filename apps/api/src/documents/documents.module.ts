import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { DatabaseModule } from "../database/database.module.js";
import { IngestionModule } from "../ingestion/ingestion.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsRateLimitGuard } from "./documents-rate-limit.guard.js";
import { DocumentsService } from "./documents.service.js";

@Module({
	imports: [
		DatabaseModule,
		StorageModule,
		IngestionModule,
		MulterModule.register({
			storage: memoryStorage(),
		}),
	],
	providers: [DocumentsService, DocumentsRateLimitGuard],
	controllers: [DocumentsController],
})
export class DocumentsModule {}
