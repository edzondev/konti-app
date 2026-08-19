ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'pending_upload';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "idempotency_key" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "documents_profile_idempotency_uidx" ON "documents" USING btree ("tax_profile_id","idempotency_key");