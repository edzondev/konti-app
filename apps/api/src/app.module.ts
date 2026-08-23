import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { DocumentProcessingModule } from "./modules/document-processing/document-processing.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { HomeModule } from "./modules/home/home.module";
import { TaxDeductionModule } from "./modules/tax-deductions/tax-deduction.module";
import { TaxIncomeModule } from "./modules/tax-income/tax-income.module";
import { TaxPeriodModule } from "./modules/tax-period/tax-period.module";
import { TaxProfileModule } from "./modules/tax-profile/tax-profile.module";
import { TaxStatusModule } from "./modules/tax-status/tax-status.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		DatabaseModule,
		AuthModule,
		TaxProfileModule,
		TaxIncomeModule,
		TaxDeductionModule,
		TaxPeriodModule,
		TaxStatusModule,
		HomeModule,
		DocumentsModule,
		DocumentProcessingModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
