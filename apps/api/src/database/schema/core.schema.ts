import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	char,
	check,
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
import type {
	DeductionAttentionReason,
	DeductionRequirement,
	FourthServiceActivityType,
	MedicalDeductionBeneficiary,
	RentAttribution,
} from "../../modules/tax-deductions/tax-deduction.types";
import { user } from "./auth.schema";
import type {
	ActivityClassificationSource,
	AttentionPriority,
	AttentionSource,
	AttentionStatus,
	CalculationDisposition,
	CoverageScope,
	DeductionCalculationStatus,
	DeductionVerificationStatus,
	DocumentProcessingType,
	DocumentSource,
	DocumentStatus,
	DocumentType,
	IncomeMode,
	MonthlyFactState,
	MonthlyFourthActivityClassification,
	MonthlyFourthCoverage,
	ProcessingStatus,
	SuspensionRestartState,
	TaxDeductionCategory,
	TaxDeductionSource,
	TaxEvaluationStatus,
	TaxEvaluationType,
	TaxFactVerificationScope,
	TaxIncomeRecordKind,
	TaxIncomeRecordStatus,
	TaxIncomeSource,
	TaxIncomeType,
	TaxPeriodFactSource,
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
		deductionDniBlindIndex: text("deduction_dni_blind_index"),
		deductionDniLast4: char("deduction_dni_last4", { length: 4 }),

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
		uniqueIndex("documents_profile_idempotency_uidx").on(table.taxProfileId, table.idempotencyKey),
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

		activityClassificationSource: text(
			"activity_classification_source",
		).$type<ActivityClassificationSource>(),

		source: text("source").$type<TaxIncomeSource>().notNull(),

		idempotencyKey: text("idempotency_key"),

		receivedAt: date("received_at", { mode: "string" }),

		recordKind: text("record_kind").$type<TaxIncomeRecordKind>().default("payment").notNull(),

		coverageStart: date("coverage_start", { mode: "string" }),
		coverageEnd: date("coverage_end", { mode: "string" }),
		coverageScope: text("coverage_scope").$type<CoverageScope>(),

		calculationDisposition: text("calculation_disposition")
			.$type<CalculationDisposition>()
			.default("included")
			.notNull(),

		coveredByRecordId: uuid("covered_by_record_id").references(
			(): AnyPgColumn => taxIncomeRecords.id,
			{ onDelete: "no action" },
		),

		coverageResolutionReason: text("coverage_resolution_reason"),

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
		index("tax_income_records_profile_coverage_idx").on(
			table.taxProfileId,
			table.coverageStart,
			table.coverageEnd,
		),
		index("tax_income_records_covered_by_idx").on(table.coveredByRecordId),
		index("tax_income_records_profile_disposition_idx").on(
			table.taxProfileId,
			table.calculationDisposition,
		),
		index("tax_income_records_profile_status_idx").on(table.taxProfileId, table.status),
		uniqueIndex("tax_income_records_profile_idempotency_uidx")
			.on(table.taxProfileId, table.idempotencyKey)
			.where(sql`${table.idempotencyKey} IS NOT NULL`),
		uniqueIndex("tax_income_records_active_source_document_uidx")
			.on(table.sourceDocumentId)
			.where(sql`${table.sourceDocumentId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
		check(
			"tax_income_records_kind_shape_check",
			sql`(
				(${table.incomeType} = 'employment'
					AND ${table.receivedAt} IS NULL
					AND ${table.recordKind} IN ('period', 'year_to_date_snapshot')
					AND ${table.coverageStart} IS NOT NULL
					AND ${table.coverageEnd} IS NOT NULL
					AND ${table.coverageScope} IS NOT NULL
					AND ${table.coverageScope} IN ('single_payer', 'all_employers'))
				OR
				(${table.incomeType} IN ('fourth_ordinary', 'fourth_special')
					AND ${table.receivedAt} IS NOT NULL
					AND ${table.recordKind} = 'payment'
					AND ${table.coverageStart} IS NULL
					AND ${table.coverageEnd} IS NULL
					AND ${table.coverageScope} IS NULL)
			)`,
		),
		check(
			"tax_income_records_coverage_range_check",
			sql`${table.coverageStart} IS NULL OR ${table.coverageEnd} IS NULL OR ${table.coverageStart} <= ${table.coverageEnd}`,
		),
		check(
			"tax_income_records_coverage_link_check",
			sql`(
				(${table.calculationDisposition} = 'excluded_by_coverage'
					AND ${table.coveredByRecordId} IS NOT NULL
					AND ${table.coverageResolutionReason} IS NOT NULL)
				OR
				(${table.calculationDisposition} <> 'excluded_by_coverage'
					AND ${table.coveredByRecordId} IS NULL)
			)`,
		),
		check(
			"tax_income_records_no_self_coverage_check",
			sql`${table.coveredByRecordId} IS NULL OR ${table.coveredByRecordId} <> ${table.id}`,
		),
		check(
			"tax_income_records_canonical_values_check",
			sql`(
				${table.source} IN ('manual', 'document', 'import', 'integration')
				AND ${table.calculationDisposition} IN ('included', 'excluded_by_coverage', 'needs_resolution')
				AND (
					(${table.incomeType} = 'employment' AND ${table.activityClassificationSource} IS NULL)
					OR (${table.incomeType} IN ('fourth_ordinary', 'fourth_special')
						AND ${table.activityClassificationSource} IS NOT NULL
						AND ${table.activityClassificationSource} IN ('manual_confirmation', 'migrated_default', 'document'))
				)
			)`,
		),
	],
);

export const taxPeriodReviews = pgTable(
	"tax_period_reviews",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),
		period: char("period", { length: 7 }).notNull(),
		coverage: text("coverage").$type<MonthlyFourthCoverage>().notNull(),
		activityClassification: text("activity_classification")
			.$type<MonthlyFourthActivityClassification>()
			.notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tax_period_reviews_profile_period_active_uidx")
			.on(table.taxProfileId, table.period)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("tax_period_reviews_profile_idempotency_uidx").on(
			table.taxProfileId,
			table.idempotencyKey,
		),
		index("tax_period_reviews_profile_period_idx").on(table.taxProfileId, table.period),
		check("tax_period_reviews_period_check", sql`${table.period} ~ '^2026-(0[1-9]|1[0-2])$'`),
		check(
			"tax_period_reviews_values_check",
			sql`${table.coverage} IN ('complete', 'partial', 'unknown') AND ${table.activityClassification} IN ('ordinary', 'special', 'unknown')`,
		),
	],
);

export const taxFourthSuspensions = pgTable(
	"tax_fourth_suspensions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),
		period: char("period", { length: 7 }).notNull(),
		answer: text("answer").$type<MonthlyFactState>().notNull(),
		authorizationDate: date("authorization_date", { mode: "string" }),
		effectiveFrom: date("effective_from", { mode: "string" }),
		validThrough: date("valid_through", { mode: "string" }),
		restartState: text("restart_state").$type<SuspensionRestartState>().notNull(),
		restartDate: date("restart_date", { mode: "string" }),
		verificationScope: text("verification_scope").$type<TaxFactVerificationScope>().notNull(),
		source: text("source").$type<TaxPeriodFactSource>().notNull(),
		sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),
		idempotencyKey: text("idempotency_key").notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tax_fourth_suspensions_profile_period_active_uidx")
			.on(table.taxProfileId, table.period)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("tax_fourth_suspensions_profile_idempotency_uidx").on(
			table.taxProfileId,
			table.idempotencyKey,
		),
		index("tax_fourth_suspensions_profile_period_idx").on(table.taxProfileId, table.period),
		index("tax_fourth_suspensions_document_idx").on(table.sourceDocumentId),
		check("tax_fourth_suspensions_period_check", sql`${table.period} ~ '^2026-(0[1-9]|1[0-2])$'`),
		check(
			"tax_fourth_suspensions_shape_check",
			sql`(
				(${table.answer} = 'yes'
					AND ${table.authorizationDate} IS NOT NULL
					AND ${table.effectiveFrom} = ${table.authorizationDate} + 1
					AND ${table.validThrough} = '2026-12-31'
					AND ${table.effectiveFrom} <= ${table.validThrough}
					AND ((${table.restartState} = 'required'
						AND ${table.restartDate} IS NOT NULL
						AND ${table.restartDate} >= ${table.effectiveFrom}
						AND ${table.restartDate} <= ${table.validThrough})
						OR (${table.restartState} IN ('not_required', 'unknown') AND ${table.restartDate} IS NULL)))
				OR (${table.answer} = 'no'
					AND ${table.authorizationDate} IS NULL
					AND ${table.effectiveFrom} IS NULL
					AND ${table.validThrough} IS NULL
					AND ${table.restartState} = 'not_required'
					AND ${table.restartDate} IS NULL)
				OR (${table.answer} = 'unknown'
					AND ${table.authorizationDate} IS NULL
					AND ${table.effectiveFrom} IS NULL
					AND ${table.validThrough} IS NULL
					AND ${table.restartState} = 'unknown'
					AND ${table.restartDate} IS NULL)
			)`,
		),
		check(
			"tax_fourth_suspensions_fact_values_check",
			sql`${table.verificationScope} IN ('user_provided', 'evidence_attached', 'system_verified')
				AND ${table.source} IN ('manual', 'document', 'integration')`,
		),
	],
);

export const taxFilingRecords = pgTable(
	"tax_filing_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),
		period: char("period", { length: 7 }).notNull(),
		formType: text("form_type").default("virtual_616").notNull(),
		answer: text("answer").$type<MonthlyFactState>().notNull(),
		filedAt: date("filed_at", { mode: "string" }),
		confirmationNumber: text("confirmation_number"),
		verificationScope: text("verification_scope").$type<TaxFactVerificationScope>().notNull(),
		source: text("source").$type<TaxPeriodFactSource>().notNull(),
		sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),
		idempotencyKey: text("idempotency_key").notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tax_filing_records_profile_period_form_active_uidx")
			.on(table.taxProfileId, table.period, table.formType)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("tax_filing_records_profile_idempotency_uidx").on(
			table.taxProfileId,
			table.idempotencyKey,
		),
		index("tax_filing_records_profile_period_idx").on(table.taxProfileId, table.period),
		index("tax_filing_records_document_idx").on(table.sourceDocumentId),
		check("tax_filing_records_period_check", sql`${table.period} ~ '^2026-(0[1-9]|1[0-2])$'`),
		check(
			"tax_filing_records_shape_check",
			sql`(${table.answer} = 'yes' AND ${table.filedAt} IS NOT NULL) OR (${table.answer} IN ('no', 'unknown') AND ${table.filedAt} IS NULL AND ${table.confirmationNumber} IS NULL)`,
		),
		check(
			"tax_filing_records_fact_values_check",
			sql`${table.verificationScope} IN ('user_provided', 'evidence_attached', 'system_verified')
				AND ${table.source} IN ('manual', 'document', 'integration')`,
		),
	],
);

export const taxPaymentRecords = pgTable(
	"tax_payment_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),
		period: char("period", { length: 7 }).notNull(),
		answer: text("answer").$type<MonthlyFactState>().notNull(),
		amountPen: numeric("amount_pen", { precision: 14, scale: 2 }),
		paidAt: date("paid_at", { mode: "string" }),
		confirmationCode: text("confirmation_code"),
		verificationScope: text("verification_scope").$type<TaxFactVerificationScope>().notNull(),
		source: text("source").$type<TaxPeriodFactSource>().notNull(),
		sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),
		idempotencyKey: text("idempotency_key").notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tax_payment_records_profile_period_active_uidx")
			.on(table.taxProfileId, table.period)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("tax_payment_records_profile_idempotency_uidx").on(
			table.taxProfileId,
			table.idempotencyKey,
		),
		index("tax_payment_records_profile_period_idx").on(table.taxProfileId, table.period),
		index("tax_payment_records_document_idx").on(table.sourceDocumentId),
		check("tax_payment_records_period_check", sql`${table.period} ~ '^2026-(0[1-9]|1[0-2])$'`),
		check(
			"tax_payment_records_shape_check",
			sql`(${table.answer} = 'yes' AND ${table.amountPen} > 0 AND ${table.paidAt} IS NOT NULL) OR (${table.answer} IN ('no', 'unknown') AND ${table.amountPen} IS NULL AND ${table.paidAt} IS NULL AND ${table.confirmationCode} IS NULL)`,
		),
		check(
			"tax_payment_records_fact_values_check",
			sql`${table.verificationScope} IN ('user_provided', 'evidence_attached', 'system_verified')
				AND ${table.source} IN ('manual', 'document', 'integration')`,
		),
	],
);

export const taxDeductionRecords = pgTable(
	"tax_deduction_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		taxProfileId: uuid("tax_profile_id")
			.notNull()
			.references(() => taxProfiles.id, { onDelete: "cascade" }),
		sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
			onDelete: "set null",
		}),
		category: text("category").$type<TaxDeductionCategory>().notNull(),
		source: text("source").$type<TaxDeductionSource>().notNull(),
		idempotencyKey: text("idempotency_key"),
		expenseDate: date("expense_date", { mode: "string" }).notNull(),
		grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
		eligibleBase: numeric("eligible_base", { precision: 14, scale: 2 }).notNull(),
		insuranceReimbursementAmount: numeric("insurance_reimbursement_amount", {
			precision: 14,
			scale: 2,
		}),
		beneficiary: text("beneficiary").$type<MedicalDeductionBeneficiary>(),
		fourthActivityType: text("fourth_activity_type").$type<FourthServiceActivityType>(),
		rentAttribution: text("rent_attribution").$type<RentAttribution>(),
		requirements: jsonb("requirements").$type<DeductionRequirement[]>().notNull(),
		verificationStatus: text("verification_status").$type<DeductionVerificationStatus>().notNull(),
		calculationStatus: text("calculation_status").$type<DeductionCalculationStatus>().notNull(),
		attentionReasons: jsonb("attention_reasons")
			.$type<DeductionAttentionReason[]>()
			.default([])
			.notNull(),
		currencyCode: char("currency_code", { length: 3 }).default("PEN").notNull(),
		notes: text("notes"),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tax_deduction_records_profile_date_idx").on(table.taxProfileId, table.expenseDate),
		index("tax_deduction_records_document_idx").on(table.sourceDocumentId),
		index("tax_deduction_records_profile_calculation_idx").on(
			table.taxProfileId,
			table.calculationStatus,
		),
		uniqueIndex("tax_deduction_records_profile_idempotency_uidx")
			.on(table.taxProfileId, table.idempotencyKey)
			.where(sql`${table.idempotencyKey} IS NOT NULL`),
		uniqueIndex("tax_deduction_records_active_source_document_uidx")
			.on(table.sourceDocumentId)
			.where(sql`${table.sourceDocumentId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
		check(
			"tax_deduction_records_amounts_check",
			sql`${table.grossAmount} > 0 AND ${table.eligibleBase} >= 0 AND ${table.eligibleBase} <= ${table.grossAmount} AND (${table.insuranceReimbursementAmount} IS NULL OR (${table.insuranceReimbursementAmount} >= 0 AND ${table.insuranceReimbursementAmount} <= ${table.grossAmount}))`,
		),
		check(
			"tax_deduction_records_category_shape_check",
			sql`(
				(${table.category} = 'medical_dental_services' AND ${table.beneficiary} IS NOT NULL AND ${table.fourthActivityType} IS NULL AND ${table.rentAttribution} IS NULL)
				OR (${table.category} = 'other_fourth_services' AND ${table.beneficiary} IS NULL AND ${table.insuranceReimbursementAmount} IS NULL AND ${table.fourthActivityType} IS NOT NULL AND ${table.rentAttribution} IS NULL)
				OR (${table.category} = 'rent' AND ${table.beneficiary} IS NULL AND ${table.insuranceReimbursementAmount} IS NULL AND ${table.fourthActivityType} IS NULL AND ${table.rentAttribution} IS NOT NULL)
				OR (${table.category} IN ('restaurants_hotels', 'household_worker_essalud') AND ${table.beneficiary} IS NULL AND ${table.insuranceReimbursementAmount} IS NULL AND ${table.fourthActivityType} IS NULL AND ${table.rentAttribution} IS NULL)
			)`,
		),
		check(
			"tax_deduction_records_canonical_values_check",
			sql`${table.verificationStatus} IN ('unknown', 'user_confirmed', 'evidence_attached', 'system_verified')
				AND ${table.calculationStatus} IN ('excluded', 'potential', 'included')
				AND ${table.source} IN ('manual', 'document', 'integration')`,
		),
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
		index("attention_items_profile_status_type_idx").on(
			table.taxProfileId,
			table.status,
			table.itemType,
		),
		index("attention_items_document_idx").on(table.documentId),
	],
);
