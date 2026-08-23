import type { AttentionPriority } from "../../database/schema/schema.types";

export const ATTENTION_REPOSITORY = Symbol("ATTENTION_REPOSITORY");

export const OPEN_ACTIONABLE_ITEM_TYPES = [
	"confirm_fourth_income",
	"confirm_rhe_payment",
	"resolve_employment_coverage",
	"review_tax_deduction",
	"verify_deduction",
	"review_monthly_fourth",
] as const;

export type OpenAttentionRow = Readonly<{
	id: string;
	itemType: string;
	priority: AttentionPriority;
	title: string;
	message: string | null;
	actionType: string | null;
	actionPayload: Record<string, unknown>;
	documentId: string | null;
	resolution: Record<string, unknown> | null;
	createdAt: Date;
}>;

export type OpenAttentionRepositoryResult = Readonly<{
	rows: readonly OpenAttentionRow[];
	totalCount: number;
}>;

export interface AttentionRepositoryPort {
	readOpenOwned(
		userId: string,
		taxYear: 2026,
		limit: number,
	): Promise<OpenAttentionRepositoryResult>;
}

export type HomeAttentionAction =
	| Readonly<{ kind: "review_rhe_payment"; documentId: string }>
	| Readonly<{ kind: "classify_fourth_activity"; documentId: string }>
	| Readonly<{ kind: "resolve_employment_coverage"; recordId: string }>
	| Readonly<{ kind: "verify_deduction"; deductionId: string }>
	| Readonly<{ kind: "review_monthly_fourth"; period: string }>;

export type HomeAttentionItemType =
	| "confirm_rhe_payment"
	| "classify_fourth_activity"
	| "resolve_employment_coverage"
	| "verify_deduction"
	| "review_monthly_fourth";

export type HomeAttentionItem = Readonly<{
	id: string;
	itemType: HomeAttentionItemType;
	title: string;
	description: string;
	action: HomeAttentionAction;
}>;

export type OpenAttentionReadModel = Readonly<{
	count: number;
	items: readonly HomeAttentionItem[];
	nextItem: HomeAttentionItem | null;
}>;
