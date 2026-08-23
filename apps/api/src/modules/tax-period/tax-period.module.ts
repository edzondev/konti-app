import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxStatusModule } from "../tax-status/tax-status.module";
import { TaxPeriodController } from "./tax-period.controller";
import { TaxPeriodRepository } from "./tax-period.repository";
import { TaxPeriodService } from "./tax-period.service";
import { TAX_PERIOD_REPOSITORY } from "./tax-period.types";

@Module({
	imports: [AuthModule, DatabaseModule, TaxProfileModule, TaxStatusModule],
	controllers: [TaxPeriodController],
	providers: [
		TaxPeriodService,
		TaxPeriodRepository,
		{
			provide: TAX_PERIOD_REPOSITORY,
			useExisting: TaxPeriodRepository,
		},
	],
	exports: [TaxPeriodService],
})
export class TaxPeriodModule {}
