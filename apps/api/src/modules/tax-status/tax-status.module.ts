import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxEngineModule } from "../tax-engine/tax-engine.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxEvaluationsController, TaxStatusController } from "./tax-status.controller";
import { TaxStatusRepository } from "./tax-status.repository";
import { TaxStatusService } from "./tax-status.service";
import { TAX_STATUS_REPOSITORY } from "./tax-status.types";

@Module({
	imports: [AuthModule, DatabaseModule, TaxEngineModule, TaxProfileModule],
	controllers: [TaxStatusController, TaxEvaluationsController],
	providers: [
		TaxStatusService,
		TaxStatusRepository,
		{
			provide: TAX_STATUS_REPOSITORY,
			useExisting: TaxStatusRepository,
		},
	],
	exports: [TaxStatusService],
})
export class TaxStatusModule {}
