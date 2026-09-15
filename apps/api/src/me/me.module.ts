import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { MeController } from "./me.controller.js";
import { MeService } from "./me.service.js";

@Module({
	imports: [DatabaseModule, StorageModule],
	controllers: [MeController],
	providers: [MeService],
})
export class MeModule {}
