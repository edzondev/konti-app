export type TaxProfileStatus = "draft" | "complete" | "needs_review";

export type IncomeMode = "employment" | "independent" | "mixed";

export type TaxIncomeType = "employment" | "independent_services";

export type TaxIncomeSource = "manual" | "document" | "import" | "integration";

export type TaxIncomeRecordStatus = "pending" | "confirmed";

export type DocumentType =
	| "unknown"
	| "receipt"
	| "invoice"
	| "fee_receipt"
	| "payroll_slip"
	| "withholding_certificate"
	| "sunat_document"
	| "other";

export type DocumentSource =
	| "camera"
	| "gallery"
	| "file"
	| "share_sheet"
	| "bank_signal"
	| "manual";

export type DocumentStatus =
	| "uploaded"
	| "queued"
	| "processing"
	| "ready"
	| "needs_review"
	| "failed"
	| "duplicate";

export type TaxRelevanceStatus =
	| "unknown"
	| "potentially_relevant"
	| "not_relevant"
	| "needs_review";

export type DocumentProcessingType =
	| "extraction"
	| "classification"
	| "duplicate_check"
	| "full_pipeline";

export type ProcessingStatus = "queued" | "processing" | "succeeded" | "failed";

export type TaxEvaluationType = "document" | "current_status" | "period_review" | "annual_review";

export type TaxEvaluationStatus =
	| "pending"
	| "completed"
	| "needs_review"
	| "failed"
	| "superseded";

export type AttentionSource =
	| "document_processing"
	| "tax_engine"
	| "profile"
	| "billing"
	| "system"
	| "bank_signal";

export type AttentionStatus = "open" | "resolved" | "dismissed" | "expired";

export type AttentionPriority = "low" | "normal" | "high" | "urgent";

export type MobilePlatform = "android" | "ios";

export type BuildEnvironment = "development" | "preview" | "production";

export type NotificationPermissionStatus = "unknown" | "granted" | "denied" | "provisional";

export type NotificationStatus = "pending" | "sent" | "provider_accepted" | "failed" | "opened";

export type BankSignalStatus =
	| "received"
	| "parsed"
	| "ignored"
	| "reminder_created"
	| "matched"
	| "dismissed"
	| "expired";

export type BillingEnvironment = "sandbox" | "production";

export type BillingEventStatus = "received" | "processed" | "ignored" | "failed";

export type EntitlementSource = "revenuecat" | "manual" | "promotion";

export type EntitlementStatus = "active" | "expired" | "revoked";
