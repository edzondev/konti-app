import * as v from "valibot";

// Env vars llegan como string: transformamos a número con default si falta.
const numberFromEnv = (fallback: number, min = 0) =>
	v.pipe(
		v.optional(v.string()),
		v.transform((value) => (value ? Number(value) : fallback)),
		v.integer(),
		v.minValue(min),
	);

export const EnvSchema = v.object({
	NODE_ENV: v.optional(v.picklist(["development", "test", "production"]), "development"),

	PORT: numberFromEnv(3000, 1),

	DATABASE_URL: v.pipe(v.string(), v.startsWith("postgres")),
	DATABASE_DIRECT_URL: v.optional(v.pipe(v.string(), v.startsWith("postgres"))),
	DATABASE_POOL_MAX: numberFromEnv(10, 1),
	DATABASE_CONNECTION_TIMEOUT_MS: numberFromEnv(15_000),
	DATABASE_IDLE_TIMEOUT_MS: numberFromEnv(30_000),

	BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(1)),
	BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
	GOOGLE_WEB_CLIENT_ID: v.pipe(v.string(), v.minLength(1)),
	GOOGLE_CLIENT_SECRET: v.pipe(v.string(), v.minLength(1)),

	R2_ACCOUNT_ID: v.pipe(v.string(), v.minLength(1)),
	R2_ACCESS_KEY_ID: v.pipe(v.string(), v.minLength(1)),
	R2_SECRET_ACCESS_KEY: v.pipe(v.string(), v.minLength(1)),
	R2_BUCKET_NAME: v.pipe(v.string(), v.minLength(1)),
	R2_DOWNLOAD_TTL_SECONDS: numberFromEnv(300, 1),

	MISTRAL_API_KEY: v.pipe(v.string(), v.minLength(1)),

	POSTHOG_API_KEY: v.pipe(v.string(), v.minLength(1)),
	POSTHOG_HOST: v.optional(v.pipe(v.string(), v.url()), "https://us.i.posthog.com"),

	// Tope global de llamadas Mistral OCR por mes (America/Lima). 0 = degradar a manual.
	OCR_MONTHLY_LIMIT: numberFromEnv(100, 0),
	OCR_TIMEOUT_MS: numberFromEnv(30_000, 1_000),
});

export type Env = v.InferOutput<typeof EnvSchema>;

/**
 * Se pasa a `ConfigModule.forRoot({ validate })`: si falta o es inválida alguna
 * variable, el arranque falla con un mensaje que dice exactamente cuál.
 */
export function validateEnv(config: Record<string, unknown>): Env {
	const parsed = v.safeParse(EnvSchema, config);
	if (parsed.success) return parsed.output;

	const flat = v.flatten<typeof EnvSchema>(parsed.issues);
	const nested: Record<string, string[] | undefined> = flat.nested ?? {};
	const details = Object.entries(nested)
		.flatMap(([field, messages]) => (messages ?? []).map((message) => `  - ${field}: ${message}`))
		.join("\n");

	throw new Error(`Configuración de entorno inválida:\n${details}`);
}
