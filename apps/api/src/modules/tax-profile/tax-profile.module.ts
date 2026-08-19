import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { TaxProfileController } from "./tax-profile.controller";
import { TaxProfileService } from "./tax-profile.service";

@Module({
	imports: [AuthModule, DatabaseModule],
	controllers: [TaxProfileController],
	providers: [TaxProfileService],
	exports: [TaxProfileService],
})
export class TaxProfileModule {}
