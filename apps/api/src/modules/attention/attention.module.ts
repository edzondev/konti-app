import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { AttentionController } from "./attention.controller";
import { AttentionRepository } from "./attention.repository";
import { AttentionService } from "./attention.service";
import { ATTENTION_REPOSITORY } from "./attention.types";

@Module({
	imports: [AuthModule, DatabaseModule],
	controllers: [AttentionController],
	providers: [
		AttentionService,
		AttentionRepository,
		{ provide: ATTENTION_REPOSITORY, useExisting: AttentionRepository },
	],
	exports: [AttentionService],
})
export class AttentionModule {}
