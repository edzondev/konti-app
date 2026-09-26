import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

// En local el .env vive en la raíz del monorepo. En Railway no hay archivo:
// DATABASE_URL ya viene en el entorno.
const envFile = resolve(dirname(fileURLToPath(import.meta.url)), "../../.env");
if (existsSync(envFile)) {
	process.loadEnvFile(envFile);
}

// Preferimos la URL directa (sin pooler) para migraciones; si no existe,
// caemos a DATABASE_URL en lugar de fallar en silencio.
const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
	throw new Error(
		"DATABASE_DIRECT_URL (o DATABASE_URL) no está definida. Revisa app-konti/.env antes de correr drizzle-kit.",
	);
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/database/schema/index.ts",
	out: "./drizzle",
	dbCredentials: { url },
});
