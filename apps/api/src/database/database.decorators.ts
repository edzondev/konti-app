import { Inject } from "@nestjs/common";
import { DATABASE } from "./database.constants.js";

/**
 * Atajo para inyectar el cliente de Drizzle sin repetir `@Inject(DATABASE)`.
 */
export const InjectDatabase = () => Inject(DATABASE);
