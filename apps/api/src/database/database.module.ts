import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DATABASE } from "./database.constants.js";
import { DatabaseService } from "./database.service.js";

@Module({
	imports: [ConfigModule],
	providers: [
		DatabaseService,
		{
			provide: DATABASE,
			useFactory: (databaseService: DatabaseService) => databaseService.db,
			inject: [DatabaseService],
		},
	],
	// Los consumidores inyectan el cliente vía `DATABASE`; `DatabaseService`
	// queda interno (es infraestructura: pool + lifecycle).
	exports: [DATABASE],
})
export class DatabaseModule {}
