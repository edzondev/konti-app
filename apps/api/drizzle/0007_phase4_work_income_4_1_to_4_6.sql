CREATE TABLE "tax_deduction_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"source_document_id" uuid,
	"category" text NOT NULL,
	"source" text NOT NULL,
	"idempotency_key" text,
	"expense_date" date NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"eligible_base" numeric(14, 2) NOT NULL,
	"insurance_reimbursement_amount" numeric(14, 2),
	"beneficiary" text,
	"fourth_activity_type" text,
	"rent_attribution" text,
	"requirements" jsonb NOT NULL,
	"verification_status" text NOT NULL,
	"calculation_status" text NOT NULL,
	"attention_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"currency_code" char(3) DEFAULT 'PEN' NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_deduction_records_amounts_check" CHECK ("tax_deduction_records"."gross_amount" > 0 AND "tax_deduction_records"."eligible_base" >= 0 AND "tax_deduction_records"."eligible_base" <= "tax_deduction_records"."gross_amount" AND ("tax_deduction_records"."insurance_reimbursement_amount" IS NULL OR ("tax_deduction_records"."insurance_reimbursement_amount" >= 0 AND "tax_deduction_records"."insurance_reimbursement_amount" <= "tax_deduction_records"."gross_amount"))),
	CONSTRAINT "tax_deduction_records_category_shape_check" CHECK ((
				("tax_deduction_records"."category" = 'medical_dental_services' AND "tax_deduction_records"."beneficiary" IS NOT NULL AND "tax_deduction_records"."fourth_activity_type" IS NULL AND "tax_deduction_records"."rent_attribution" IS NULL)
				OR ("tax_deduction_records"."category" = 'other_fourth_services' AND "tax_deduction_records"."beneficiary" IS NULL AND "tax_deduction_records"."insurance_reimbursement_amount" IS NULL AND "tax_deduction_records"."fourth_activity_type" IS NOT NULL AND "tax_deduction_records"."rent_attribution" IS NULL)
				OR ("tax_deduction_records"."category" = 'rent' AND "tax_deduction_records"."beneficiary" IS NULL AND "tax_deduction_records"."insurance_reimbursement_amount" IS NULL AND "tax_deduction_records"."fourth_activity_type" IS NULL AND "tax_deduction_records"."rent_attribution" IS NOT NULL)
				OR ("tax_deduction_records"."category" IN ('restaurants_hotels', 'household_worker_essalud') AND "tax_deduction_records"."beneficiary" IS NULL AND "tax_deduction_records"."insurance_reimbursement_amount" IS NULL AND "tax_deduction_records"."fourth_activity_type" IS NULL AND "tax_deduction_records"."rent_attribution" IS NULL)
			)),
	CONSTRAINT "tax_deduction_records_canonical_values_check" CHECK ("tax_deduction_records"."verification_status" IN ('unknown', 'user_confirmed', 'evidence_attached', 'system_verified')
				AND "tax_deduction_records"."calculation_status" IN ('excluded', 'potential', 'included')
				AND "tax_deduction_records"."source" IN ('manual', 'document', 'integration'))
);
--> statement-breakpoint
CREATE TABLE "tax_filing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"period" char(7) NOT NULL,
	"form_type" text DEFAULT 'virtual_616' NOT NULL,
	"answer" text NOT NULL,
	"filed_at" date,
	"confirmation_number" text,
	"verification_scope" text NOT NULL,
	"source" text NOT NULL,
	"source_document_id" uuid,
	"idempotency_key" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_filing_records_period_check" CHECK ("tax_filing_records"."period" ~ '^2026-(0[1-9]|1[0-2])$'),
	CONSTRAINT "tax_filing_records_shape_check" CHECK (("tax_filing_records"."answer" = 'yes' AND "tax_filing_records"."filed_at" IS NOT NULL) OR ("tax_filing_records"."answer" IN ('no', 'unknown') AND "tax_filing_records"."filed_at" IS NULL AND "tax_filing_records"."confirmation_number" IS NULL)),
	CONSTRAINT "tax_filing_records_fact_values_check" CHECK ("tax_filing_records"."verification_scope" IN ('user_provided', 'evidence_attached', 'system_verified')
				AND "tax_filing_records"."source" IN ('manual', 'document', 'integration'))
);
--> statement-breakpoint
CREATE TABLE "tax_fourth_suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"period" char(7) NOT NULL,
	"answer" text NOT NULL,
	"authorization_date" date,
	"effective_from" date,
	"valid_through" date,
	"restart_state" text NOT NULL,
	"restart_date" date,
	"verification_scope" text NOT NULL,
	"source" text NOT NULL,
	"source_document_id" uuid,
	"idempotency_key" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_fourth_suspensions_period_check" CHECK ("tax_fourth_suspensions"."period" ~ '^2026-(0[1-9]|1[0-2])$'),
	CONSTRAINT "tax_fourth_suspensions_shape_check" CHECK ((
				("tax_fourth_suspensions"."answer" = 'yes'
					AND "tax_fourth_suspensions"."authorization_date" IS NOT NULL
					AND "tax_fourth_suspensions"."effective_from" = "tax_fourth_suspensions"."authorization_date" + 1
					AND "tax_fourth_suspensions"."valid_through" = '2026-12-31'
					AND "tax_fourth_suspensions"."effective_from" <= "tax_fourth_suspensions"."valid_through"
					AND (("tax_fourth_suspensions"."restart_state" = 'required'
						AND "tax_fourth_suspensions"."restart_date" IS NOT NULL
						AND "tax_fourth_suspensions"."restart_date" >= "tax_fourth_suspensions"."effective_from"
						AND "tax_fourth_suspensions"."restart_date" <= "tax_fourth_suspensions"."valid_through")
						OR ("tax_fourth_suspensions"."restart_state" IN ('not_required', 'unknown') AND "tax_fourth_suspensions"."restart_date" IS NULL)))
				OR ("tax_fourth_suspensions"."answer" = 'no'
					AND "tax_fourth_suspensions"."authorization_date" IS NULL
					AND "tax_fourth_suspensions"."effective_from" IS NULL
					AND "tax_fourth_suspensions"."valid_through" IS NULL
					AND "tax_fourth_suspensions"."restart_state" = 'not_required'
					AND "tax_fourth_suspensions"."restart_date" IS NULL)
				OR ("tax_fourth_suspensions"."answer" = 'unknown'
					AND "tax_fourth_suspensions"."authorization_date" IS NULL
					AND "tax_fourth_suspensions"."effective_from" IS NULL
					AND "tax_fourth_suspensions"."valid_through" IS NULL
					AND "tax_fourth_suspensions"."restart_state" = 'unknown'
					AND "tax_fourth_suspensions"."restart_date" IS NULL)
			)),
	CONSTRAINT "tax_fourth_suspensions_fact_values_check" CHECK ("tax_fourth_suspensions"."verification_scope" IN ('user_provided', 'evidence_attached', 'system_verified')
				AND "tax_fourth_suspensions"."source" IN ('manual', 'document', 'integration'))
);
--> statement-breakpoint
CREATE TABLE "tax_payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"period" char(7) NOT NULL,
	"answer" text NOT NULL,
	"amount_pen" numeric(14, 2),
	"paid_at" date,
	"confirmation_code" text,
	"verification_scope" text NOT NULL,
	"source" text NOT NULL,
	"source_document_id" uuid,
	"idempotency_key" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_payment_records_period_check" CHECK ("tax_payment_records"."period" ~ '^2026-(0[1-9]|1[0-2])$'),
	CONSTRAINT "tax_payment_records_shape_check" CHECK (("tax_payment_records"."answer" = 'yes' AND "tax_payment_records"."amount_pen" > 0 AND "tax_payment_records"."paid_at" IS NOT NULL) OR ("tax_payment_records"."answer" IN ('no', 'unknown') AND "tax_payment_records"."amount_pen" IS NULL AND "tax_payment_records"."paid_at" IS NULL AND "tax_payment_records"."confirmation_code" IS NULL)),
	CONSTRAINT "tax_payment_records_fact_values_check" CHECK ("tax_payment_records"."verification_scope" IN ('user_provided', 'evidence_attached', 'system_verified')
				AND "tax_payment_records"."source" IN ('manual', 'document', 'integration'))
);
--> statement-breakpoint
CREATE TABLE "tax_period_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_profile_id" uuid NOT NULL,
	"period" char(7) NOT NULL,
	"coverage" text NOT NULL,
	"activity_classification" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_period_reviews_period_check" CHECK ("tax_period_reviews"."period" ~ '^2026-(0[1-9]|1[0-2])$'),
	CONSTRAINT "tax_period_reviews_values_check" CHECK ("tax_period_reviews"."coverage" IN ('complete', 'partial', 'unknown') AND "tax_period_reviews"."activity_classification" IN ('ordinary', 'special', 'unknown'))
);
--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "activity_classification_source" text;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "record_kind" text DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "coverage_start" date;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "coverage_end" date;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "coverage_scope" text;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "calculation_disposition" text DEFAULT 'included' NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "covered_by_record_id" uuid;--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD COLUMN "coverage_resolution_reason" text;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD COLUMN "deduction_dni_blind_index" text;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD COLUMN "deduction_dni_last4" char(4);--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "tax_income_records"
		WHERE "income_type" NOT IN ('independent_services', 'fourth_ordinary', 'fourth_special')
			OR "source" NOT IN ('manual', 'document', 'import', 'integration')
	) THEN
		RAISE EXCEPTION USING
			ERRCODE = '23514',
			MESSAGE = 'Cannot migrate tax income records: unsupported historical income_type or source';
	END IF;
END
$$;--> statement-breakpoint
UPDATE "tax_income_records"
SET
	"income_type" = CASE WHEN "income_type" = 'independent_services' THEN 'fourth_ordinary' ELSE "income_type" END,
	"activity_classification_source" = 'migrated_default',
	"record_kind" = 'payment',
	"calculation_disposition" = 'included'
WHERE "income_type" IN ('independent_services', 'fourth_ordinary', 'fourth_special');--> statement-breakpoint
ALTER TABLE "tax_income_records" ALTER COLUMN "received_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_deduction_records" ADD CONSTRAINT "tax_deduction_records_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_deduction_records" ADD CONSTRAINT "tax_deduction_records_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_records" ADD CONSTRAINT "tax_filing_records_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_records" ADD CONSTRAINT "tax_filing_records_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_fourth_suspensions" ADD CONSTRAINT "tax_fourth_suspensions_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_fourth_suspensions" ADD CONSTRAINT "tax_fourth_suspensions_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_payment_records" ADD CONSTRAINT "tax_payment_records_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_payment_records" ADD CONSTRAINT "tax_payment_records_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_period_reviews" ADD CONSTRAINT "tax_period_reviews_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tax_deduction_records_profile_date_idx" ON "tax_deduction_records" USING btree ("tax_profile_id","expense_date");--> statement-breakpoint
CREATE INDEX "tax_deduction_records_document_idx" ON "tax_deduction_records" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "tax_deduction_records_profile_calculation_idx" ON "tax_deduction_records" USING btree ("tax_profile_id","calculation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_deduction_records_profile_idempotency_uidx" ON "tax_deduction_records" USING btree ("tax_profile_id","idempotency_key") WHERE "tax_deduction_records"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_deduction_records_active_source_document_uidx" ON "tax_deduction_records" USING btree ("source_document_id") WHERE "tax_deduction_records"."source_document_id" IS NOT NULL AND "tax_deduction_records"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_filing_records_profile_period_form_active_uidx" ON "tax_filing_records" USING btree ("tax_profile_id","period","form_type") WHERE "tax_filing_records"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_filing_records_profile_idempotency_uidx" ON "tax_filing_records" USING btree ("tax_profile_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tax_filing_records_profile_period_idx" ON "tax_filing_records" USING btree ("tax_profile_id","period");--> statement-breakpoint
CREATE INDEX "tax_filing_records_document_idx" ON "tax_filing_records" USING btree ("source_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_fourth_suspensions_profile_period_active_uidx" ON "tax_fourth_suspensions" USING btree ("tax_profile_id","period") WHERE "tax_fourth_suspensions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_fourth_suspensions_profile_idempotency_uidx" ON "tax_fourth_suspensions" USING btree ("tax_profile_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tax_fourth_suspensions_profile_period_idx" ON "tax_fourth_suspensions" USING btree ("tax_profile_id","period");--> statement-breakpoint
CREATE INDEX "tax_fourth_suspensions_document_idx" ON "tax_fourth_suspensions" USING btree ("source_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_payment_records_profile_period_active_uidx" ON "tax_payment_records" USING btree ("tax_profile_id","period") WHERE "tax_payment_records"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_payment_records_profile_idempotency_uidx" ON "tax_payment_records" USING btree ("tax_profile_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tax_payment_records_profile_period_idx" ON "tax_payment_records" USING btree ("tax_profile_id","period");--> statement-breakpoint
CREATE INDEX "tax_payment_records_document_idx" ON "tax_payment_records" USING btree ("source_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_period_reviews_profile_period_active_uidx" ON "tax_period_reviews" USING btree ("tax_profile_id","period") WHERE "tax_period_reviews"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_period_reviews_profile_idempotency_uidx" ON "tax_period_reviews" USING btree ("tax_profile_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tax_period_reviews_profile_period_idx" ON "tax_period_reviews" USING btree ("tax_profile_id","period");--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_covered_by_record_id_tax_income_records_id_fk" FOREIGN KEY ("covered_by_record_id") REFERENCES "public"."tax_income_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attention_items_profile_status_type_idx" ON "attention_items" USING btree ("tax_profile_id","status","item_type");--> statement-breakpoint
CREATE INDEX "tax_income_records_profile_coverage_idx" ON "tax_income_records" USING btree ("tax_profile_id","coverage_start","coverage_end");--> statement-breakpoint
CREATE INDEX "tax_income_records_covered_by_idx" ON "tax_income_records" USING btree ("covered_by_record_id");--> statement-breakpoint
CREATE INDEX "tax_income_records_profile_disposition_idx" ON "tax_income_records" USING btree ("tax_profile_id","calculation_disposition");--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_kind_shape_check" CHECK ((
				("tax_income_records"."income_type" = 'employment'
					AND "tax_income_records"."received_at" IS NULL
					AND "tax_income_records"."record_kind" IN ('period', 'year_to_date_snapshot')
					AND "tax_income_records"."coverage_start" IS NOT NULL
					AND "tax_income_records"."coverage_end" IS NOT NULL
					AND "tax_income_records"."coverage_scope" IS NOT NULL
					AND "tax_income_records"."coverage_scope" IN ('single_payer', 'all_employers'))
				OR
				("tax_income_records"."income_type" IN ('fourth_ordinary', 'fourth_special')
					AND "tax_income_records"."received_at" IS NOT NULL
					AND "tax_income_records"."record_kind" = 'payment'
					AND "tax_income_records"."coverage_start" IS NULL
					AND "tax_income_records"."coverage_end" IS NULL
					AND "tax_income_records"."coverage_scope" IS NULL)
			));--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_coverage_range_check" CHECK ("tax_income_records"."coverage_start" IS NULL OR "tax_income_records"."coverage_end" IS NULL OR "tax_income_records"."coverage_start" <= "tax_income_records"."coverage_end");--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_coverage_link_check" CHECK ((
				("tax_income_records"."calculation_disposition" = 'excluded_by_coverage'
					AND "tax_income_records"."covered_by_record_id" IS NOT NULL
					AND "tax_income_records"."coverage_resolution_reason" IS NOT NULL)
				OR
				("tax_income_records"."calculation_disposition" <> 'excluded_by_coverage'
					AND "tax_income_records"."covered_by_record_id" IS NULL)
			));--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_no_self_coverage_check" CHECK ("tax_income_records"."covered_by_record_id" IS NULL OR "tax_income_records"."covered_by_record_id" <> "tax_income_records"."id");--> statement-breakpoint
ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_canonical_values_check" CHECK ((
				"tax_income_records"."source" IN ('manual', 'document', 'import', 'integration')
				AND "tax_income_records"."calculation_disposition" IN ('included', 'excluded_by_coverage', 'needs_resolution')
				AND (
					("tax_income_records"."income_type" = 'employment' AND "tax_income_records"."activity_classification_source" IS NULL)
					OR ("tax_income_records"."income_type" IN ('fourth_ordinary', 'fourth_special')
						AND "tax_income_records"."activity_classification_source" IS NOT NULL
						AND "tax_income_records"."activity_classification_source" IN ('manual_confirmation', 'migrated_default', 'document'))
				)
			));
