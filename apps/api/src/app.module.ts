import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { DocumentProcessingModule } from "./modules/document-processing/document-processing.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { HomeModule } from "./modules/home/home.module";
import { TaxProfileModule } from "./modules/tax-profile/tax-profile.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		DatabaseModule,
		AuthModule,
		TaxProfileModule,
		HomeModule,
		DocumentsModule,
		DocumentProcessingModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
