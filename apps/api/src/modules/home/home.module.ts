import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { TaxProfileModule } from "../tax-profile/tax-profile.module";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";

@Module({
	imports: [AuthModule, TaxProfileModule],
	controllers: [HomeController],
	providers: [HomeService],
})
export class HomeModule {}
