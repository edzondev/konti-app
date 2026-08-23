export type DocumentListStatus = "uploaded" | "processing" | "ready" | "needs_review" | "failed";

export type DocumentType =
	| "unknown"
	| "receipt"
	| "invoice"
	| "fee_receipt"
	| "payroll_slip"
	| "withholding_certificate"
	| "sunat_document"
	| "other";

export type DoubtfulField = "issuerTaxId" | "issueDate" | "totalAmount" | "documentType";

export type ListSubtitleTone = "muted" | "gold" | "primary";

export type DocumentListItem = {
	id: string;
	status: DocumentListStatus;
	source: "camera" | "gallery";
	createdAt: string;
	originalFileName: string | null;
	mimeType: string;
	previewUrl: string;
	previewExpiresAt: string;
	issuerName?: string | null;
	issuerTaxId?: string | null;
	totalAmount?: string | null;
	currencyCode?: "PEN" | "USD" | null;
	documentType?: DocumentType | null;
	issueDate?: string | null;
	documentNumber?: string | null;
	subtotalAmount?: string | null;
	taxAmount?: string | null;
	doubtfulFields?: DoubtfulField[];
};

export type DocumentDetail = {
	document: Omit<DocumentListItem, "previewUrl" | "previewExpiresAt">;
	processing: {
		status: "queued" | "processing" | "succeeded" | "failed";
		attemptNumber: number;
		doubtfulFields: DoubtfulField[];
	} | null;
	attention: null;
	fourthIncomeCandidate?: FourthIncomeCandidate | null;
	employmentIncomeCandidate?: EmploymentIncomeCandidate | null;
	taxDeductionCandidate?: TaxDeductionCandidate | null;
	/** Temporary compatibility with the 4.1 response key. */
	taxIncomeCandidate?: FourthIncomeCandidate | null;
};

export type FourthIncomeCandidateWarning =
	| "document_not_ready"
	| "missing_gross_amount"
	| "missing_withholding_amount";

export type FourthIncomeCandidate = {
	eligibility: "eligible" | "insufficient_fields" | "unsupported_currency" | "already_decided";
	issueDate: string | null;
	paymentTerms: "cash" | "credit" | "unknown";
	dueDate: string | null;
	documentReportedPaymentDate: string | null;
	grossAmount: string | null;
	withheldTaxAmount: string | null;
	netPaidAmount: string | null;
	payerName: string | null;
	decision: "paid" | "unpaid" | "unsure" | "activity_unsure" | "not_mine" | null;
	warnings: FourthIncomeCandidateWarning[];
};

export type EmploymentIncomeCandidateWarning =
	| "document_not_ready"
	| "missing_record_kind"
	| "missing_coverage_start"
	| "missing_coverage_end"
	| "missing_coverage_scope"
	| "missing_gross_amount"
	| "missing_withheld_tax_amount"
	| "missing_payer"
	| "invalid_coverage_start"
	| "invalid_coverage_end"
	| "invalid_coverage_range"
	| "invalid_coverage_combination"
	| "invalid_gross_amount"
	| "invalid_withheld_tax_amount"
	| "invalid_payer_tax_id";

export type EmploymentIncomeCandidate = {
	eligibility: "eligible" | "insufficient_fields" | "unsupported_currency" | "already_decided";
	recordKind: "period" | "year_to_date_snapshot" | null;
	coverageStart: string | null;
	coverageEnd: string | null;
	coverageScope: "single_payer" | "all_employers" | null;
	grossAmount: string | null;
	withheldTaxAmount: string | null;
	payerName: string | null;
	payerTaxId: string | null;
	verificationScope: "unverified_ocr_evidence";
	warnings: EmploymentIncomeCandidateWarning[];
};

export type TaxDeductionCandidate = {
	categoryHint:
		| "restaurants_hotels"
		| "medical_dental_services"
		| "other_fourth_services"
		| "rent"
		| "household_worker_essalud";
	issueDate: string;
	grossAmount: string;
	insuranceReimbursementAmount: string | null;
	serviceDescription: string | null;
	paymentMethodEvidence: string | null;
	propertyCountry: string | null;
	propertyUse: string | null;
	supportingFormNumber: string | null;
	workerRegistrationEvidence: string | null;
	attributionHint: "taxpayer" | "spouse_or_partner" | "unknown" | null;
	verificationStatus: "evidence_attached";
	calculationStatus: "potential";
	consumerIdentityEvidence: "matches" | "does_not_match" | "unknown";
	warnings: string[];
};

export type DocumentsPage = {
	items: DocumentListItem[];
	nextCursor: string | null;
};

export type CreateDocumentUploadInput = {
	source: "camera" | "gallery";
	originalFileName: string;
	mimeType: "image/jpeg" | "image/png";
	sizeBytes: number;
	sha256: string;
	pageCount: 1;
	idempotencyKey: string;
};

export type CreateDocumentUploadResult =
	| {
			duplicate: false;
			document: { id: string; status: "pending_upload" };
			upload: {
				url: string;
				method: "PUT";
				headers: Record<string, string>;
				expiresAt: string;
			};
	  }
	| {
			duplicate: true;
			document: { id: string; status: string };
	  };
