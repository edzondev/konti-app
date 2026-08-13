import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { DatabaseModule } from "src/database/database.module";
import { TaxProfileController } from "./tax-profile.controller";
import { TaxProfileService } from "./tax-profile.service";

@Module({
	imports: [AuthModule, DatabaseModule],
	controllers: [TaxProfileController],
	providers: [TaxProfileService],
})
export class TaxProfileModule {}
