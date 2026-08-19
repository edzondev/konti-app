import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { R2StorageAdapter } from "./r2-storage.adapter";
import { OBJECT_STORAGE } from "./storage.constants";

@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: OBJECT_STORAGE,
			useClass: R2StorageAdapter,
		},
	],
	exports: [OBJECT_STORAGE],
})
export class StorageModule {}
