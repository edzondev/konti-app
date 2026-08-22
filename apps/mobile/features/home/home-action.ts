import type { HomePrimaryAction } from "./types";

export function homeActionRoute(action: HomePrimaryAction): string | null {
	switch (action) {
		case "open_capture":
			return "/guardar";
		case "open_tax_income":
			return "/tax-income-form";
		case "open_tax_status":
			return "/tax-status";
		case "review_document":
			return "/comprobantes";
		default:
			return null;
	}
}
