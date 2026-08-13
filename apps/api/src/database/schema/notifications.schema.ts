import {
	boolean,
	char,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { attentionItems, documents } from "./core.schema";
import type {
	BankSignalStatus,
	BuildEnvironment,
	MobilePlatform,
	NotificationPermissionStatus,
	NotificationStatus,
} from "./schema.types";

export const deviceInstallations = pgTable(
	"device_installations",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		installationId: text("installation_id").notNull().unique(),

		platform: text("platform").$type<MobilePlatform>().notNull(),

		environment: text("environment").$type<BuildEnvironment>().notNull(),

		expoPushToken: text("expo_push_token").unique(),
		nativePushToken: text("native_push_token"),

		notificationPermissionStatus: text("notification_permission_status")
			.$type<NotificationPermissionStatus>()
			.default("unknown")
			.notNull(),

		appVersion: text("app_version"),
		buildNumber: text("build_number"),
		osVersion: text("os_version"),
		deviceModel: text("device_model"),
		locale: text("locale"),
		timezone: text("timezone"),

		isActive: boolean("is_active").default(true).notNull(),

		lastSeenAt: timestamp("last_seen_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("device_installations_user_active_idx").on(table.userId, table.isActive),
		index("device_installations_native_token_idx").on(table.nativePushToken),
	],
);

export const notificationDeliveries = pgTable(
	"notification_deliveries",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		deviceInstallationId: uuid("device_installation_id").references(() => deviceInstallations.id, {
			onDelete: "set null",
		}),

		attentionItemId: uuid("attention_item_id").references(() => attentionItems.id, {
			onDelete: "set null",
		}),

		documentId: uuid("document_id").references(() => documents.id, {
			onDelete: "set null",
		}),

		notificationType: text("notification_type").notNull(),

		/*
		 * Debe ser única por evento y dispositivo.
		 *
		 * Ejemplo:
		 * document-ready:<documentId>:<installationId>
		 */
		idempotencyKey: text("idempotency_key").notNull().unique(),

		status: text("status").$type<NotificationStatus>().default("pending").notNull(),

		/*
		 * Identificador devuelto por Expo al aceptar el envío.
		 * Se utiliza posteriormente para consultar el push receipt.
		 */
		providerTicketId: text("provider_ticket_id"),

		errorCode: text("error_code"),
		errorMessage: text("error_message"),

		/*
		 * El backend envió correctamente la solicitud al proveedor.
		 */
		sentAt: timestamp("sent_at", {
			withTimezone: true,
		}),

		/*
		 * FCM o APNs aceptó el mensaje.
		 * No significa que el usuario lo haya visto.
		 */
		providerAcceptedAt: timestamp("provider_accepted_at", {
			withTimezone: true,
		}),

		/*
		 * La aplicación confirma este campo cuando el usuario
		 * pulsa la notificación.
		 */
		openedAt: timestamp("opened_at", {
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("notification_deliveries_user_status_idx").on(table.userId, table.status),
		index("notification_deliveries_installation_idx").on(table.deviceInstallationId),
		index("notification_deliveries_attention_item_idx").on(table.attentionItemId),
		index("notification_deliveries_document_idx").on(table.documentId),
		index("notification_deliveries_provider_ticket_idx").on(table.providerTicketId),
	],
);

export const bankNotificationSignals = pgTable(
	"bank_notification_signals",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		deviceInstallationId: uuid("device_installation_id").references(() => deviceInstallations.id, {
			onDelete: "set null",
		}),

		/*
		 * Package Android que originó la notificación.
		 * Ejemplo: pe.com.interbank.mobilebanking
		 */
		sourcePackage: text("source_package").notNull(),

		sourceAppName: text("source_app_name"),

		/*
		 * Hash calculado con los datos mínimos de la señal.
		 * Evita procesar dos veces la misma notificación bancaria.
		 */
		signalHash: text("signal_hash").notNull(),

		occurredAt: timestamp("occurred_at", {
			withTimezone: true,
		}).notNull(),

		merchantName: text("merchant_name"),

		amount: numeric("amount", {
			precision: 14,
			scale: 2,
		}),

		currencyCode: char("currency_code", {
			length: 3,
		}),

		confidence: numeric("confidence", {
			precision: 5,
			scale: 4,
		}),

		parserVersion: text("parser_version"),

		status: text("status").$type<BankSignalStatus>().default("received").notNull(),

		relatedDocumentId: uuid("related_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),

		attentionItemId: uuid("attention_item_id").references(() => attentionItems.id, {
			onDelete: "set null",
		}),

		processedAt: timestamp("processed_at", {
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("bank_notification_signals_user_hash_uidx").on(table.userId, table.signalHash),
		index("bank_notification_signals_user_status_occurred_idx").on(
			table.userId,
			table.status,
			table.occurredAt,
		),
		index("bank_notification_signals_document_idx").on(table.relatedDocumentId),
		index("bank_notification_signals_attention_item_idx").on(table.attentionItemId),
	],
);
