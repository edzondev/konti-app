import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DATABASE } from "./database.constants";
import { DatabaseService } from "./database.service";

@Module({
	imports: [ConfigModule],
	providers: [
		DatabaseService,
		{
			provide: DATABASE,
			useFactory: (databaseService: DatabaseService) => {
				return databaseService.db;
			},
			inject: [DatabaseService],
		},
	],
	exports: [DATABASE, DatabaseService],
})
export class DatabaseModule {}
