import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { TaxProfileModule } from './tax-profile/tax-profile.module';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, TaxProfileModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
