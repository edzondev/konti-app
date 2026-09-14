import { NestFactory } from "@nestjs/core";
import { toNodeHandler } from "better-auth/node";
import { json, urlencoded } from "express";
import { StandardSchemaValidationPipe } from "nestjs-standard-schema";
import { AppModule } from "./app.module.js";
import { AUTH } from "./auth/auth.constants.js";
import type { Auth } from "./auth/auth.factory.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: false,
	});

	app.enableShutdownHooks();
	const auth = app.get<Auth>(AUTH);
	const expressApp = app.getHttpAdapter().getInstance();

	expressApp.all("/api/auth/*splat", toNodeHandler(auth));
	expressApp.use(json());
	expressApp.use(urlencoded({ extended: true }));
	app.useGlobalPipes(new StandardSchemaValidationPipe());

	await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}
await bootstrap();
