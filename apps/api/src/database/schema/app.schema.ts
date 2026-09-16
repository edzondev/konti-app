import { sql } from "drizzle-orm";
import {
	AnyPgColumn,
	boolean,
	char,
	date,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";

/**
 * documents
 *
 * Entidad núcleo de Konti. Un comprobante capturado por el usuario.
 * Vive durante todo su ciclo de vida: pending → ready | failed.
 *
 * Notas:
 * - No tiene perfil tributario asociado. Pertenece a un user, punto.
 * - No guarda el binario. Solo la referencia a object storage (object_key).
 * - Los campos de extracción pueden ser null hasta que el worker termine.
 */
export const documents = pgTable(
	"documents",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		// Pertenencia
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Estado del procesamiento
		status: text("status").$type<"pending" | "ready" | "failed">().default("pending").notNull(),

		// Archivo en object storage
		objectKey: text("object_key").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		sha256: text("sha256").notNull(),

		// Origen de la captura
		source: text("source").$type<"camera" | "gallery" | "share">().notNull(),

		// Datos extraídos (null hasta que el worker termine)
		documentType: text("document_type")
			.$type<"boleta" | "factura" | "recibo_honorarios" | "ticket" | "unknown">()
			.default("unknown")
			.notNull(),
		issuerName: text("issuer_name"),
		issuerTaxId: text("issuer_tax_id"), // RUC
		issueDate: date("issue_date"),
		documentNumber: text("document_number"),
		currencyCode: char("currency_code", { length: 3 }),
		totalAmount: numeric("total_amount", { precision: 14, scale: 2 }),
		igvAmount: numeric("igv_amount", { precision: 14, scale: 2 }),
		// Cómo se obtuvieron los datos
		extractionSource: text("extraction_source").$type<"qr" | "ocr" | "local" | "manual">(),
		wasUserCorrected: boolean("was_user_corrected").default(false).notNull(),

		// Duplicados
		duplicateOfId: uuid("duplicate_of_id").references((): AnyPgColumn => documents.id, {
			onDelete: "set null",
		}),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// Listar comprobantes de un usuario por fecha (para el selector de mes)
		index("documents_user_date_idx").on(table.userId, table.issueDate),

		// Filtrar por estado (para el worker y para el listado)
		index("documents_user_status_idx").on(table.userId, table.status),

		// Deduplicación fuerte: un hash vivo por usuario
		uniqueIndex("documents_user_sha256_alive_uidx")
			.on(table.userId, table.sha256)
			.where(sql`${table.deletedAt} is null`),

		// Búsqueda rápida por sha256 (para el worker antes de insertar)
		index("documents_sha256_idx").on(table.sha256),
	],
);
