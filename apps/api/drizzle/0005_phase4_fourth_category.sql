ALTER TABLE "tax_income_records" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "tax_income_records"
		WHERE "source_document_id" IS NOT NULL
			AND "deleted_at" IS NULL
		GROUP BY "source_document_id"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION USING
			ERRCODE = '23505',
			MESSAGE = 'Cannot enforce one active tax income per source document: active duplicates exist';
	END IF;
END
$$;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_income_records_profile_idempotency_uidx" ON "tax_income_records" USING btree ("tax_profile_id","idempotency_key") WHERE "tax_income_records"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_income_records_active_source_document_uidx" ON "tax_income_records" USING btree ("source_document_id") WHERE "tax_income_records"."source_document_id" IS NOT NULL AND "tax_income_records"."deleted_at" IS NULL;
