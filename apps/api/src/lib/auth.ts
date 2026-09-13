import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../database/schema/index.js";

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
