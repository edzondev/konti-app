import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	char,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import type {
	AttentionPriority,
	AttentionSource,
	AttentionStatus,
	DocumentProcessingType,
	DocumentSource,
	DocumentStatus,
	DocumentType,
	IncomeMode,
	ProcessingStatus,
	TaxEvaluationStatus,
	TaxEvaluationType,
	TaxIncomeRecordStatus,
	TaxIncomeSource,
	TaxIncomeType,
	TaxProfileStatus,
	TaxRelevanceStatus,
} from "./schema.types";

type JsonObject = Record<string, unknown>;

export const taxProfiles = pgTable(
	"tax_profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		taxYear: integer("tax_year").notNull(),

		jurisdictionCode: char("jurisdiction_code", { length: 2 }).default("PE").notNull(),

		taxResidenceCountry: char("tax_residence_country", { length: 2 }).default("PE").notNull(),

		legalName: text("legal_name"),
		documentType: text("document_type"),

		// El servicio debe cifrar estos valores antes de persistirlos.
		documentNumber: text("document_number"),
		ruc: text("ruc"),

		isDomiciled: boolean("is_domiciled").default(true).notNull(),

		incomeMode: text("income_mode").$type<IncomeMode>(),

		trackDeductibles: boolean("track_deductibles").default(false).notNull(),

		currencyCode: char("currency_code", { length: 3 }).default("PEN").notNull(),

		timezone: text("timezone").default("America/Lima").notNull(),

		status: text("status").$type<TaxProfileStatus>().default("draft").notNull(),

		completedAt: timestamp("completed_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tax_profiles_user_year_uidx").on(table.userId, table.taxYear),
		index("tax_profiles_user_status_idx").on(table.userId, table.status),
	],
);

export const documents = pgTable(
	"documents",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),

		documentType: text("document_type").$type<DocumentType>().default("unknown").notNull(),

		source: text("source").$type<DocumentSource>().notNull(),

		status: text("status").$type<DocumentStatus>().default("pending_upload").notNull(),

		idempotencyKey: text("idempotency_key").notNull(),

		objectKey: text("object_key").notNull().unique(),
		originalFileName: text("original_file_name"),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		sha256: text("sha256").notNull(),
		pageCount: integer("page_count").default(1).notNull(),

		issuerName: text("issuer_name"),
		issuerTaxId: text("issuer_tax_id"),
		issueDate: date("issue_date", { mode: "string" }),
		documentNumber: text("document_number"),

		currencyCode: char("currency_code", { length: 3 }),

		subtotalAmount: numeric("subtotal_amount", {
			precision: 14,
			scale: 2,
		}),

		taxAmount: numeric("tax_amount", {
			precision: 14,
			scale: 2,
		}),

		totalAmount: numeric("total_amount", {
			precision: 14,
			scale: 2,
		}),

		taxRelevanceStatus: text("tax_relevance_status")
			.$type<TaxRelevanceStatus>()
			.default("unknown")
			.notNull(),

		duplicateOfId: uuid("duplicate_of_id").references((): AnyPgColumn => documents.id, {
			onDelete: "set null",
		}),

		wasUserCorrected: boolean("was_user_corrected").default(false).notNull(),

		correctedAt: timestamp("corrected_at", { withTimezone: true }),

		metadata: jsonb("metadata").$type<JsonObject>().default({}).notNull(),

		processedAt: timestamp("processed_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("documents_tax_profile_idx").on(table.taxProfileId),
		index("documents_profile_status_idx").on(table.taxProfileId, table.status),
		index("documents_profile_issue_date_idx").on(table.taxProfileId, table.issueDate),
		index("documents_sha256_idx").on(table.sha256),
		uniqueIndex("documents_profile_sha256_visible_uidx")
			.on(table.taxProfileId, table.sha256)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("documents_profile_idempotency_uidx").on(
			table.taxProfileId,
			table.idempotencyKey,
		),
	],
);

export const taxIncomeRecords = pgTable(
	"tax_income_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),

		sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),

		incomeType: text("income_type").$type<TaxIncomeType>().notNull(),

		source: text("source").$type<TaxIncomeSource>().notNull(),

		receivedAt: date("received_at", { mode: "string" }).notNull(),

		grossAmount: numeric("gross_amount", {
			precision: 14,
			scale: 2,
		}).notNull(),

		withheldTaxAmount: numeric("withheld_tax_amount", {
			precision: 14,
			scale: 2,
		})
			.default("0")
			.notNull(),

		currencyCode: char("currency_code", { length: 3 }).default("PEN").notNull(),

		exchangeRate: numeric("exchange_rate", {
			precision: 18,
			scale: 8,
		}),

		grossAmountPen: numeric("gross_amount_pen", {
			precision: 14,
			scale: 2,
		}),

		withheldTaxAmountPen: numeric("withheld_tax_amount_pen", {
			precision: 14,
			scale: 2,
		}),

		payerName: text("payer_name"),
		payerTaxId: text("payer_tax_id"),

		status: text("status").$type<TaxIncomeRecordStatus>().default("pending").notNull(),

		notes: text("notes"),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tax_income_records_profile_received_idx").on(table.taxProfileId, table.receivedAt),
		index("tax_income_records_document_idx").on(table.sourceDocumentId),
		index("tax_income_records_profile_status_idx").on(table.taxProfileId, table.status),
	],
);

export const documentProcessingRuns = pgTable(
	"document_processing_runs",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),

		processingType: text("processing_type").$type<DocumentProcessingType>().notNull(),

		attemptNumber: integer("attempt_number").notNull(),

		provider: text("provider").notNull(),
		providerVersion: text("provider_version"),
		pipelineVersion: text("pipeline_version"),

		status: text("status").$type<ProcessingStatus>().default("queued").notNull(),

		normalizedResult: jsonb("normalized_result").$type<JsonObject>().default({}).notNull(),

		fieldConfidence: jsonb("field_confidence").$type<JsonObject>().default({}).notNull(),

		rawResultObjectKey: text("raw_result_object_key"),

		errorCode: text("error_code"),
		errorMessage: text("error_message"),

		startedAt: timestamp("started_at", { withTimezone: true }),
		finishedAt: timestamp("finished_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("document_processing_runs_document_type_attempt_uidx").on(
			table.documentId,
			table.processingType,
			table.attemptNumber,
		),
		index("document_processing_runs_document_status_idx").on(table.documentId, table.status),
	],
);

export const taxEvaluations = pgTable(
	"tax_evaluations",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),

		documentId: uuid("document_id").references(() => documents.id, {
			onDelete: "set null",
		}),

		evaluationType: text("evaluation_type").$type<TaxEvaluationType>().notNull(),

		status: text("status").$type<TaxEvaluationStatus>().default("pending").notNull(),

		rulesetVersion: text("ruleset_version").notNull(),

		periodStart: date("period_start", { mode: "string" }),
		periodEnd: date("period_end", { mode: "string" }),

		triggeredBy: text("triggered_by").notNull(),

		inputSnapshot: jsonb("input_snapshot").$type<JsonObject>().default({}).notNull(),

		outputSnapshot: jsonb("output_snapshot").$type<JsonObject>().default({}).notNull(),

		supersedesId: uuid("supersedes_id").references((): AnyPgColumn => taxEvaluations.id, {
			onDelete: "set null",
		}),

		completedAt: timestamp("completed_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("tax_evaluations_profile_type_created_idx").on(
			table.taxProfileId,
			table.evaluationType,
			table.createdAt,
		),
		index("tax_evaluations_document_idx").on(table.documentId),
		index("tax_evaluations_profile_status_idx").on(table.taxProfileId, table.status),
	],
);

export const attentionItems = pgTable(
	"attention_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),

		documentId: uuid("document_id").references(() => documents.id, {
			onDelete: "set null",
		}),

		taxEvaluationId: uuid("tax_evaluation_id").references(() => taxEvaluations.id, {
			onDelete: "set null",
		}),

		source: text("source").$type<AttentionSource>().notNull(),
		itemType: text("item_type").notNull(),

		status: text("status").$type<AttentionStatus>().default("open").notNull(),

		priority: text("priority").$type<AttentionPriority>().default("normal").notNull(),

		title: text("title").notNull(),
		message: text("message"),

		actionType: text("action_type"),

		actionPayload: jsonb("action_payload").$type<JsonObject>().default({}).notNull(),

		resolution: jsonb("resolution").$type<JsonObject>(),

		deduplicationKey: text("deduplication_key"),

		dueAt: timestamp("due_at", { withTimezone: true }),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("attention_items_profile_deduplication_uidx").on(
			table.taxProfileId,
			table.deduplicationKey,
		),
		index("attention_items_profile_status_priority_idx").on(
			table.taxProfileId,
			table.status,
			table.priority,
		),
		index("attention_items_document_idx").on(table.documentId),
	],
);
