import type { HomePrimaryAction } from "./types";

export function homeActionRoute(action: HomePrimaryAction): string | null {
	if (action && typeof action === "object") {
		switch (action.kind) {
			case "open_tax_income":
				if (action.incomeMode === "independent") return "/tax-income-form";
				if (action.incomeMode === "employment") {
					return "/tax-income-form?incomeType=employment";
				}
				return "/tax-income";
			case "review_rhe_payment":
			case "classify_fourth_activity":
				return action.documentId
					? `/document/${encodeURIComponent(action.documentId)}`
					: "/comprobantes";
			case "resolve_employment_coverage": {
				const route = "/tax-income?type=employment";
				return action.recordId ? `${route}&focus=${encodeURIComponent(action.recordId)}` : route;
			}
			case "verify_deduction":
				return action.deductionId
					? `/tax-deduction-form?deductionId=${encodeURIComponent(action.deductionId)}`
					: "/tax-deduction-form";
			case "review_monthly_fourth":
				return `/monthly-fourth/${encodeURIComponent(action.period)}`;
			case "open_annual_review":
				return "/tax-status";
		}
	}
	switch (action) {
		case "open_capture":
			return "/guardar";
		case "open_tax_income":
			return "/tax-income";
		case "open_tax_status":
			return "/tax-status";
		case "review_document":
			return "/comprobantes";
		default:
			return null;
	}
}
