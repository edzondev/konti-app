import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

// El .env vive en la raíz del monorepo, no en apps/api. Lo cargamos por ruta
// absoluta para que drizzle-kit funcione sin importar el cwd.
process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), "../../.env"));

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
