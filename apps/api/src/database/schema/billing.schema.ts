import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import type {
	BillingEnvironment,
	BillingEventStatus,
	EntitlementSource,
	EntitlementStatus,
} from "./schema.types";

type JsonObject = Record<string, unknown>;

export const billingEvents = pgTable(
	"billing_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id").references(() => user.id, {
			onDelete: "set null",
		}),

		provider: text("provider").default("revenuecat").notNull(),

		providerEventId: text("provider_event_id").notNull().unique(),

		eventType: text("event_type").notNull(),

		environment: text("environment").$type<BillingEnvironment>().notNull(),

		productId: text("product_id"),
		entitlementKey: text("entitlement_key"),

		transactionId: text("transaction_id"),
		originalTransactionId: text("original_transaction_id"),

		status: text("status").$type<BillingEventStatus>().default("received").notNull(),

		payload: jsonb("payload").$type<JsonObject>().notNull(),

		errorMessage: text("error_message"),

		purchasedAt: timestamp("purchased_at", { withTimezone: true }),
		expiresAt: timestamp("expires_at", { withTimezone: true }),

		receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),

		processedAt: timestamp("processed_at", { withTimezone: true }),
	},
	(table) => [
		index("billing_events_user_received_idx").on(table.userId, table.receivedAt),
		index("billing_events_status_received_idx").on(table.status, table.receivedAt),
	],
);

export const userEntitlements = pgTable(
	"user_entitlements",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		entitlementKey: text("entitlement_key").notNull(),

		// Ejemplos: global, tax-year:2026.
		scope: text("scope").default("global").notNull(),

		productId: text("product_id"),

		source: text("source").$type<EntitlementSource>().default("revenuecat").notNull(),

		status: text("status").$type<EntitlementStatus>().default("active").notNull(),

		startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),

		expiresAt: timestamp("expires_at", { withTimezone: true }),

		metadata: jsonb("metadata").$type<JsonObject>().default({}).notNull(),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("user_entitlements_user_key_scope_uidx").on(
			table.userId,
			table.entitlementKey,
			table.scope,
		),
		index("user_entitlements_status_expiry_idx").on(table.status, table.expiresAt),
	],
);
