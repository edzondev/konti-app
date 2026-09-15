import { Global, Injectable, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PostHog } from "posthog-node";
import type { Env } from "../config/env.js";

@Injectable()
class PostHogLifecycle implements OnApplicationShutdown {
	constructor(private readonly posthog: PostHog) {}

	async onApplicationShutdown(): Promise<void> {
		await this.posthog.shutdown();
	}
}

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: PostHog,
			useFactory: (config: ConfigService<Env, true>) =>
				new PostHog(config.getOrThrow("POSTHOG_API_KEY"), {
					host: config.getOrThrow("POSTHOG_HOST"),
				}),
			inject: [ConfigService],
		},
		PostHogLifecycle,
	],
	exports: [PostHog],
})
export class PostHogModule {}
