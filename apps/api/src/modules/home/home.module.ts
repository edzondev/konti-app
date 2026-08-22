import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DocumentsModule } from "../documents/documents.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { TaxStatusModule } from "../tax-status/tax-status.module";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";

@Module({
	imports: [AuthModule, TaxProfileModule, DocumentsModule, TaxStatusModule],
	controllers: [HomeController],
	providers: [HomeService],
})
export class HomeModule {}
