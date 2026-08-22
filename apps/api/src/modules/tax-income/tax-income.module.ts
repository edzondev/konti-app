import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxStatusModule } from "../tax-status/tax-status.module";
import { TaxIncomeController } from "./tax-income.controller";
import { TaxIncomeRepository } from "./tax-income.repository";
import { TaxIncomeService } from "./tax-income.service";
import { TAX_INCOME_REPOSITORY } from "./tax-income.types";

@Module({
	imports: [AuthModule, DatabaseModule, TaxProfileModule, TaxStatusModule],
	controllers: [TaxIncomeController],
	providers: [
		TaxIncomeService,
		TaxIncomeRepository,
		{
			provide: TAX_INCOME_REPOSITORY,
			useExisting: TaxIncomeRepository,
		},
	],
	exports: [TaxIncomeService],
})
export class TaxIncomeModule {}
