import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module.js";
import { DatabaseService } from "../database/database.service.js";
import { AUTH } from "./auth.constants.js";
import { AuthController } from "./auth.controller.js";
import { createAuth } from "./auth.factory.js";

@Module({
	imports: [DatabaseModule],
	providers: [
		{
			provide: AUTH,
			useFactory: (databaseService: DatabaseService, configService: ConfigService) => {
				return createAuth(databaseService.db, configService);
			},
			inject: [DatabaseService, ConfigService],
		},
	],
	exports: [AUTH],
	controllers: [AuthController],
})
export class AuthModule {}
