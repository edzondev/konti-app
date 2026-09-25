import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { IngestionModule } from "../ingestion/ingestion.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { DocumentsRateLimitGuard } from "./documents-rate-limit.guard.js";

@Module({
	imports: [
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
