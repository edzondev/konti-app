export type MonthlyFourthStatus =
	| "insufficient_data"
	| "no_action_detected"
	| "action_likely_required"
	| "awaiting_user_confirmation"
	| "user_recorded_complete";

export type VerificationScope = "user_provided" | "evidence_attached" | "system_verified";

export type MonthlyFactState = "yes" | "no" | "unknown";

export type MonthlyFourthActivityClassification = "ordinary" | "special" | "unknown";

export type MonthlyRecordedFact = Readonly<{
	state: MonthlyFactState;
	verificationScope: VerificationScope | null;
	recordedAt?: string | null;
	amountPen?: string | null;
	confirmationCode?: string | null;
}>;

export type MonthlyReviewStepId = "coverage" | "activity" | "suspension" | "filing" | "payment";

export type MonthlySuspensionFact = Readonly<{
	state: MonthlyFactState;
	verificationScope: VerificationScope | null;
	authorizationDate: string | null;
	effectiveFrom: string | null;
	validThrough: string | null;
	restartState: "not_required" | "required" | "unknown";
	restartDate: string | null;
}>;

export type MonthlyFourthPeriod = Readonly<{
	period: string;
	status: MonthlyFourthStatus;
	activityClassification: MonthlyFourthActivityClassification;
	thresholdKind: "general" | "special" | null;
	monthlyThreshold: string | null;
	monthlyFourthGross: string;
	monthlyFifthGross: string;
	monthlyCombinedGross: string;
	registeredFourthWithholding: string;
	unsuspendedFourthGross: string;
	estimatedAdvancePayment: string | null;
	suspensionEffect: "none" | "unknown" | "future" | "active" | "partial" | "restarted";
	suspensionEffectiveFrom: string | null;
	suspensionValidThrough: string | null;
	requiresFilingReview: boolean;
	requiresPaymentReview: boolean;
	officialCompliance: "not_determined";
	coverage: "complete" | "partial" | "unknown";
	filing: MonthlyRecordedFact | null;
	payment: MonthlyRecordedFact | null;
	suspension: MonthlySuspensionFact | null;
	reasons: readonly string[];
}>;

type MutationBase = Readonly<{
	period: string;
	idempotencyKey: string;
}>;

export type MonthlyFourthMutationInput =
	| (MutationBase &
			Readonly<{
				kind: "coverage";
				coverage: "complete" | "partial" | "unknown";
			}>)
	| (MutationBase &
			Readonly<{
				kind: "activity";
				activityClassification: MonthlyFourthActivityClassification;
			}>)
	| (MutationBase &
			Readonly<{
				kind: "suspension";
				answer: MonthlyFactState;
				authorizationDate: string | null;
				restartState: "not_required" | "required" | "unknown";
				restartDate: string | null;
			}>)
	| (MutationBase &
			Readonly<{
				kind: "filing";
				answer: MonthlyFactState;
				filedAt: string | null;
				confirmationNumber: string | null;
			}>)
	| (MutationBase &
			Readonly<{
				kind: "payment";
				answer: MonthlyFactState;
				amountPen: string | null;
				paidAt: string | null;
				confirmationCode: string | null;
			}>);

export type MonthlyFourthReviewInput = Readonly<{
	period: string;
	idempotencyKey: string;
	coverage: "complete" | "partial" | "unknown";
	activityClassification: MonthlyFourthActivityClassification;
	suspension: Readonly<{
		answer: MonthlyFactState;
		authorizationDate: string | null;
		restartState: "not_required" | "required" | "unknown";
		restartDate: string | null;
	}> | null;
	filing: Readonly<{
		answer: MonthlyFactState;
		filedAt: string | null;
		confirmationNumber: string | null;
	}>;
	payment: Readonly<{
		answer: MonthlyFactState;
		amountPen: string | null;
		paidAt: string | null;
		confirmationCode: string | null;
	}>;
}>;
