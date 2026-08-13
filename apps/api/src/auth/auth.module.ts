import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";
import { AUTH } from "./auth.constants";
import { AuthController } from "./auth.controller";
import { createAuth } from "./auth.factory";

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
