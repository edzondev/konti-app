CREATE TABLE "billing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"provider" text DEFAULT 'revenuecat' NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"environment" text NOT NULL,
	"product_id" text,
	"entitlement_key" text,
	"transaction_id" text,
	"original_transaction_id" text,
	"status" text DEFAULT 'received' NOT NULL,
	"payload" jsonb NOT NULL,
	"error_message" text,
	"purchased_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "billing_events_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entitlement_key" text NOT NULL,
	"scope" text DEFAULT 'global' NOT NULL,
	"product_id" text,
	"source" text DEFAULT 'revenuecat' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attention_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"document_id" uuid,
	"tax_evaluation_id" uuid,
	"source" text NOT NULL,
	"item_type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"action_type" text,
	"action_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolution" jsonb,
	"deduplication_key" text,
	"due_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_processing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"processing_type" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"provider" text NOT NULL,
	"provider_version" text,
	"pipeline_version" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"normalized_result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"field_confidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw_result_object_key" text,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"document_type" text DEFAULT 'unknown' NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"object_key" text NOT NULL,
	"original_file_name" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"issuer_name" text,
	"issuer_tax_id" text,
	"issue_date" date,
	"document_number" text,
	"currency_code" char(3),
	"subtotal_amount" numeric(14, 2),
	"tax_amount" numeric(14, 2),
	"total_amount" numeric(14, 2),
	"tax_relevance_status" text DEFAULT 'unknown' NOT NULL,
	"duplicate_of_id" uuid,
	"was_user_corrected" boolean DEFAULT false NOT NULL,
	"corrected_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "tax_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"document_id" uuid,
	"evaluation_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ruleset_version" text NOT NULL,
	"period_start" date,
	"period_end" date,
	"triggered_by" text NOT NULL,
	"input_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"supersedes_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_income_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"source_document_id" uuid,
	"income_type" text NOT NULL,
	"source" text NOT NULL,
	"received_at" date NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"withheld_tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency_code" char(3) DEFAULT 'PEN' NOT NULL,
	"exchange_rate" numeric(18, 8),
	"gross_amount_pen" numeric(14, 2),
	"withheld_tax_amount_pen" numeric(14, 2),
	"payer_name" text,
	"payer_tax_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"jurisdiction_code" char(2) DEFAULT 'PE' NOT NULL,
	"tax_residence_country" char(2) DEFAULT 'PE' NOT NULL,
	"legal_name" text,
	"document_type" text,
	"document_number" text,
	"ruc" text,
	"is_domiciled" boolean DEFAULT true NOT NULL,
	"income_mode" text,
	"currency_code" char(3) DEFAULT 'PEN' NOT NULL,
	"timezone" text DEFAULT 'America/Lima' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_notification_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"device_installation_id" uuid,
	"source_package" text NOT NULL,
	"source_app_name" text,
	"signal_hash" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"merchant_name" text,
	"amount" numeric(14, 2),
	"currency_code" char(3),
	"confidence" numeric(5, 4),
	"parser_version" text,
	"status" text DEFAULT 'received' NOT NULL,
	"related_document_id" uuid,
	"attention_item_id" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"platform" text NOT NULL,
	"environment" text NOT NULL,
	"expo_push_token" text,
	"native_push_token" text,
	"notification_permission_status" text DEFAULT 'unknown' NOT NULL,
	"app_version" text,
	"build_number" text,
	"os_version" text,
	"device_model" text,
	"locale" text,
	"timezone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_installations_installation_id_unique" UNIQUE("installation_id"),
	CONSTRAINT "device_installations_expo_push_token_unique" UNIQUE("expo_push_token")
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"device_installation_id" uuid,
	"attention_item_id" uuid,
	"document_id" uuid,
	"notification_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_ticket_id" text,
	"error_code" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"provider_accepted_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_deliveries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_tax_evaluation_id_tax_evaluations_id_fk" FOREIGN KEY ("tax_evaluation_id") REFERENCES "public"."tax_evaluations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_runs" ADD CONSTRAINT "document_processing_runs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_duplicate_of_id_documents_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_evaluations" ADD CONSTRAINT "tax_evaluations_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_evaluations" ADD CONSTRAINT "tax_evaluations_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_evaluations" ADD CONSTRAINT "tax_evaluations_supersedes_id_tax_evaluations_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."tax_evaluations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_signals" ADD CONSTRAINT "bank_notification_signals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_signals" ADD CONSTRAINT "bank_notification_signals_device_installation_id_device_installations_id_fk" FOREIGN KEY ("device_installation_id") REFERENCES "public"."device_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_signals" ADD CONSTRAINT "bank_notification_signals_related_document_id_documents_id_fk" FOREIGN KEY ("related_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_signals" ADD CONSTRAINT "bank_notification_signals_attention_item_id_attention_items_id_fk" FOREIGN KEY ("attention_item_id") REFERENCES "public"."attention_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_installations" ADD CONSTRAINT "device_installations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_device_installation_id_device_installations_id_fk" FOREIGN KEY ("device_installation_id") REFERENCES "public"."device_installations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_attention_item_id_attention_items_id_fk" FOREIGN KEY ("attention_item_id") REFERENCES "public"."attention_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_events_user_received_idx" ON "billing_events" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE INDEX "billing_events_status_received_idx" ON "billing_events" USING btree ("status","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_user_key_scope_uidx" ON "user_entitlements" USING btree ("user_id","entitlement_key","scope");--> statement-breakpoint
CREATE INDEX "user_entitlements_status_expiry_idx" ON "user_entitlements" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attention_items_profile_deduplication_uidx" ON "attention_items" USING btree ("tax_profile_id","deduplication_key");--> statement-breakpoint
CREATE INDEX "attention_items_profile_status_priority_idx" ON "attention_items" USING btree ("tax_profile_id","status","priority");--> statement-breakpoint
CREATE INDEX "attention_items_document_idx" ON "attention_items" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_processing_runs_document_type_attempt_uidx" ON "document_processing_runs" USING btree ("document_id","processing_type","attempt_number");--> statement-breakpoint
CREATE INDEX "document_processing_runs_document_status_idx" ON "document_processing_runs" USING btree ("document_id","status");--> statement-breakpoint
CREATE INDEX "documents_tax_profile_idx" ON "documents" USING btree ("tax_profile_id");--> statement-breakpoint
CREATE INDEX "documents_profile_status_idx" ON "documents" USING btree ("tax_profile_id","status");--> statement-breakpoint
CREATE INDEX "documents_profile_issue_date_idx" ON "documents" USING btree ("tax_profile_id","issue_date");--> statement-breakpoint
CREATE INDEX "documents_sha256_idx" ON "documents" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "tax_evaluations_profile_type_created_idx" ON "tax_evaluations" USING btree ("tax_profile_id","evaluation_type","created_at");--> statement-breakpoint
CREATE INDEX "tax_evaluations_document_idx" ON "tax_evaluations" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "tax_evaluations_profile_status_idx" ON "tax_evaluations" USING btree ("tax_profile_id","status");--> statement-breakpoint
CREATE INDEX "tax_income_records_profile_received_idx" ON "tax_income_records" USING btree ("tax_profile_id","received_at");--> statement-breakpoint
CREATE INDEX "tax_income_records_document_idx" ON "tax_income_records" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "tax_income_records_profile_status_idx" ON "tax_income_records" USING btree ("tax_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_profiles_user_year_uidx" ON "tax_profiles" USING btree ("user_id","tax_year");--> statement-breakpoint
CREATE INDEX "tax_profiles_user_status_idx" ON "tax_profiles" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_notification_signals_user_hash_uidx" ON "bank_notification_signals" USING btree ("user_id","signal_hash");--> statement-breakpoint
CREATE INDEX "bank_notification_signals_user_status_occurred_idx" ON "bank_notification_signals" USING btree ("user_id","status","occurred_at");--> statement-breakpoint
CREATE INDEX "bank_notification_signals_document_idx" ON "bank_notification_signals" USING btree ("related_document_id");--> statement-breakpoint
CREATE INDEX "bank_notification_signals_attention_item_idx" ON "bank_notification_signals" USING btree ("attention_item_id");--> statement-breakpoint
CREATE INDEX "device_installations_user_active_idx" ON "device_installations" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "device_installations_native_token_idx" ON "device_installations" USING btree ("native_push_token");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_status_idx" ON "notification_deliveries" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "notification_deliveries_installation_idx" ON "notification_deliveries" USING btree ("device_installation_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_attention_item_idx" ON "notification_deliveries" USING btree ("attention_item_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_document_idx" ON "notification_deliveries" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_provider_ticket_idx" ON "notification_deliveries" USING btree ("provider_ticket_id");