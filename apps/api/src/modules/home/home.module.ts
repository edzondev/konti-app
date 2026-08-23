import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { AttentionModule } from "../attention/attention.module";
import { DocumentsModule } from "../documents/documents.module";
import { TaxPeriodModule } from "../tax-period/tax-period.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxStatusModule } from "../tax-status/tax-status.module";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { HomeCurrentService } from "./home-current.service";

@Module({
	imports: [
		AuthModule,
		AttentionModule,
		TaxProfileModule,
		TaxPeriodModule,
		DocumentsModule,
		TaxStatusModule,
	],
	controllers: [HomeController],
	providers: [HomeService, HomeCurrentService],
})
export class HomeModule {}
