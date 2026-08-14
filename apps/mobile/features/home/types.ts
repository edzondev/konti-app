export type HomeUiState = "new-user" | "all-clear" | "needs-decision" | "upcoming";

export type HomeMockProfile = {
	firstName: string;
	initials: string;
	incomeLabel: string;
	fiscalYear: string;
	profileStatus: string;
	currency: string;
	maskedRuc: string;
};

export type HomeDecisionReceipt = {
	merchant: string;
	detail: string;
	amount: string;
	confirmLabel: string;
	reviewLabel: string;
};

export type HomeAllClearContent = {
	heading: string;
	explanation: string;
	highlight: string;
	linkLabel: string;
};

export type HomeUpcomingContent = {
	heading: string;
	explanation: string;
	suggestion: string;
};
