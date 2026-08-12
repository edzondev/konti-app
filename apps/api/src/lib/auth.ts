/**
 * Standalone Better Auth instance for the CLI only
 * (`pnpm dlx auth@latest generate --config ./src/lib/auth.ts`).
 *
 * NestJS creates auth via `createAuth()` in AuthModule — do not import this
 * file into the Nest app.
 */
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../database/schema";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
	database: drizzleAdapter(drizzle({ client: pool, schema }), {
		provider: "pg",
		schema,
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
});
