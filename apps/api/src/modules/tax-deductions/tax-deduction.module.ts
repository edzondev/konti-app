import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxStatusModule } from "../tax-status/tax-status.module";
import { TaxDeductionController } from "./tax-deduction.controller";
import { TAX_DEDUCTION_REPOSITORY } from "./tax-deduction.persistence.types";
import { TaxDeductionRepository } from "./tax-deduction.repository";
import { TaxDeductionService } from "./tax-deduction.service";

@Module({
	imports: [AuthModule, DatabaseModule, TaxProfileModule, TaxStatusModule],
	controllers: [TaxDeductionController],
	providers: [
		TaxDeductionService,
		TaxDeductionRepository,
		{ provide: TAX_DEDUCTION_REPOSITORY, useExisting: TaxDeductionRepository },
	],
	exports: [TaxDeductionService],
})
export class TaxDeductionModule {}
