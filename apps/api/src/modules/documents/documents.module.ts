import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { StorageModule } from "../../core/storage/storage.module";
import { DatabaseModule } from "../../database/database.module";
import { DocumentProcessingModule } from "../document-processing/document-processing.module";
import { TaxDeductionModule } from "../tax-deductions/tax-deduction.module";
import { TaxIncomeModule } from "../tax-income/tax-income.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { DocumentsController } from "./documents.controller";
import { DocumentsRepository } from "./documents.repository";
import { DocumentsService } from "./documents.service";

@Module({
	imports: [
		AuthModule,
		DatabaseModule,
		TaxProfileModule,
		TaxIncomeModule,
		TaxDeductionModule,
		StorageModule,
		DocumentProcessingModule,
	],
	controllers: [DocumentsController],
	providers: [DocumentsRepository, DocumentsService],
	exports: [DocumentsService],
})
export class DocumentsModule {}
