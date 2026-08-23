export type MonthlyFourthStatus =
	| "insufficient_data"
	| "no_action_detected"
	| "action_likely_required"
	| "awaiting_user_confirmation"
	| "user_recorded_complete";

export type VerificationScope = "user_provided" | "evidence_attached" | "system_verified";

export type MonthlyFourthCoverage = "complete" | "partial" | "unknown";

export type MonthlyFourthActivityType = "fourth_ordinary" | "fourth_special" | "unknown";

export type MonthlyFourthActivityClassification = "ordinary" | "special" | "unknown";

export type MonthlyFourthIncome = Readonly<{
	id: string;
	activityType: MonthlyFourthActivityType;
	receivedAt: string;
	grossAmountPen: string;
	withheldTaxAmountPen: string;
}>;

export type SuspensionRestart =
	| Readonly<{ status: "not_required" }>
	| Readonly<{ status: "unknown" }>
	| Readonly<{ status: "required"; restartDate: string }>;

export type MonthlyFourthSuspension =
	| Readonly<{ status: "unknown" }>
	| Readonly<{
			status: "none";
			verificationScope: VerificationScope;
	  }>
	| Readonly<{
			status: "authorized";
			authorizationDate: string;
			restart: SuspensionRestart;
			verificationScope: VerificationScope;
	  }>;

export type RecordedMonthlyFact =
	| Readonly<{ state: "unknown" }>
	| Readonly<{
			state: "yes" | "no";
			verificationScope: VerificationScope;
	  }>;

export type MonthlyFourthInput = Readonly<{
	period: string;
	activityClassification: MonthlyFourthActivityClassification;
	fourthIncomes: readonly MonthlyFourthIncome[];
	fifthGrossAmountPen: string;
	coverage: MonthlyFourthCoverage;
	pendingDocumentCount: number;
	suspension: MonthlyFourthSuspension;
	filing?: RecordedMonthlyFact;
	payment?: RecordedMonthlyFact;
}>;

export type MonthlyFourthThresholdKind = "general" | "special";

export type MonthlyFourthSuspensionEffect =
	| "none"
	| "unknown"
	| "future"
	| "active"
	| "partial"
	| "restarted";

export type MonthlyFourthReason =
	| "income_coverage_incomplete"
	| "activity_classification_unknown"
	| "pending_documents"
	| "suspension_unknown"
	| "restart_conditions_unknown"
	| "no_fourth_income"
	| "below_monthly_threshold"
	| "valid_suspension"
	| "withholding_covers_advance_payment"
	| "monthly_action_likely"
	| "guided_facts_pending"
	| "guided_facts_recorded";

export type MonthlyFourthResult = Readonly<{
	period: string;
	status: MonthlyFourthStatus;
	activityClassification: MonthlyFourthActivityClassification;
	thresholdKind: MonthlyFourthThresholdKind | null;
	monthlyThreshold: string | null;
	monthlyFourthGross: string;
	monthlyFifthGross: string;
	monthlyCombinedGross: string;
	registeredFourthWithholding: string;
	unsuspendedFourthGross: string;
	estimatedAdvancePayment: string | null;
	suspensionEffect: MonthlyFourthSuspensionEffect;
	suspensionEffectiveFrom: string | null;
	filing: RecordedMonthlyFact | null;
	payment: RecordedMonthlyFact | null;
	requiresFilingReview: boolean;
	requiresPaymentReview: boolean;
	officialCompliance: "not_determined";
	reasons: readonly MonthlyFourthReason[];
}>;
