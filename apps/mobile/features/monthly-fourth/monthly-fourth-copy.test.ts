import { describe, expect, it } from "vitest";

import {
	monthlyDifferenceCopy,
	monthlyFourthStatusCopy,
	monthlyReviewStepsFor,
	monthlyThresholdCopy,
	verificationScopeCopy,
} from "./monthly-fourth-copy";
import type { MonthlyFourthStatus } from "./types";

describe("monthly fourth beginner copy", () => {
	it("asks one question at a time in the approved order", () => {
		expect(monthlyReviewStepsFor("unknown").map((step) => step.id)).toEqual([
			"coverage",
			"activity",
			"suspension",
			"filing",
			"payment",
		]);
		expect(monthlyReviewStepsFor("ordinary").map((step) => step.id)).toEqual([
			"coverage",
			"suspension",
			"filing",
			"payment",
		]);
	});

	it.each([
		"insufficient_data",
		"no_action_detected",
		"action_likely_required",
		"awaiting_user_confirmation",
		"user_recorded_complete",
	] satisfies MonthlyFourthStatus[])("never presents %s as SUNAT compliance", (status) => {
		const copy = monthlyFourthStatusCopy(status);
		const rendered = `${copy.title} ${copy.body}`.toLocaleLowerCase("es-PE");

		expect(rendered).not.toMatch(/cumpliste|al día ante sunat|sin pendientes tributarios/);
	});

	it("describes a completed record without claiming official verification", () => {
		expect(monthlyFourthStatusCopy("user_recorded_complete")).toEqual({
			title: "Registraste la información de este mes.",
			body: "Esto resume lo que registraste en Konti; no confirma el estado del mes ante SUNAT.",
		});
	});

	it("explains both thresholds in ordinary language", () => {
		expect(monthlyThresholdCopy("general", "4010.00")).toContain(
			"servicios independientes comunes",
		);
		expect(monthlyThresholdCopy("special", "3208.00")).toContain("actividad especial");
	});

	it("keeps the estimated difference neutral", () => {
		expect(monthlyDifferenceCopy("320.80")).toBe(
			"Diferencia estimada después de las retenciones registradas: S/ 320.80.",
		);
		expect(monthlyDifferenceCopy(null)).toBe("Aún no podemos estimar la diferencia de este mes.");
	});

	it("labels verification scope as read-only evidence provenance", () => {
		expect(verificationScopeCopy("user_provided")).toBe("Información indicada por ti");
		expect(verificationScopeCopy("evidence_attached")).toBe("Con evidencia adjunta");
		expect(verificationScopeCopy("system_verified")).toBe(
			"Verificado mediante una integración oficial",
		);
	});
});
