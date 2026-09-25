import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { validateEnv } from "./config/env.js";
import { DatabaseModule } from "./database/database.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthModule } from "./health/health.module.js";
import { IngestionModule } from "./ingestion/ingestion.module.js";
import { MeModule } from "./me/me.module.js";
import { PostHogModule } from "./posthog/posthog.module.js";
import { StorageModule } from "./storage/storage.module.js";

process.loadEnvFile();

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
		DatabaseModule,
		AuthModule,
		DocumentsModule,
		StorageModule,
		IngestionModule,
		HealthModule,
		PostHogModule,
		MeModule,
	],
})
export class AppModule {}
