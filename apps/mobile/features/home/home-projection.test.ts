import { describe, expect, it } from "vitest";

import {
	homeExcludedFactorCopy,
	homeLoadStateCopy,
	homeVerificationStatusCopy,
	projectHome,
} from "./home-projection";
import type { HomeResponse } from "./types";

function homeFixture(overrides: Partial<HomeResponse> = {}): HomeResponse {
	return {
		status: "calculated",
		taxYear: 2026,
		primary: {
			code: "VIEW_TAX_STATUS",
			title: "Estimación actualizada",
			description: "Con tus datos registrados hasta hoy.",
			action: "open_tax_status",
		},
		attention: { count: 0, nextItem: null },
		taxSummary: null,
		workIncome: {
			fourthGrossAmount: "12000.00",
			employmentGrossAmount: "48000.00",
		},
		deductions: {
			includedAmount: "850.00",
			potentialAmount: "320.00",
			unknownCount: 2,
			includedVerificationStatuses: ["user_confirmed", "evidence_attached"],
		},
		coverage: {
			incomeCoverage: "complete",
			deductionCoverage: "partial",
			monthlyCoverage: "complete",
			excludedFactors: ["annual_filing_obligation_not_determined"],
		},
		monthlyOutstandingCount: 0,
		summary: {
			processedDocuments: 4,
			processingDocuments: 0,
			potentiallyRelevantAmount: null,
		},
		nextRelevantEvent: null,
		updatedAt: "2026-08-23T12:00:00.000Z",
		...overrides,
	};
}

describe("projectHome", () => {
	it("puts the server-selected actionable exception before all summaries", () => {
		const home = homeFixture({
			status: "attention_required",
			attention: {
				count: 3,
				nextItem: {
					id: "attention-1",
					itemType: "resolve_employment_coverage",
					title: "Revisa un cruce de planilla",
					description: "Una boleta puede estar dentro de un acumulado.",
					action: { kind: "resolve_employment_coverage", recordId: "income-1" },
				},
			},
		});

		const projected = projectHome(home);

		expect(projected.sectionOrder).toEqual(["attention", "work_income", "deductions", "coverage"]);
		expect(projected.attention).toMatchObject({
			title: "Revisa un cruce de planilla",
			description: "Una boleta puede estar dentro de un acumulado.",
			actionLabel: "Revisar cruce",
		});
		expect(projected.hero).toEqual({
			eyebrow: "REQUIERE TU ATENCIÓN",
			title: "Empecemos por esto",
			description: "Te mostramos primero lo que puede cambiar tu estimación.",
			tone: "attention",
		});
	});

	it.each([
		["confirm_rhe_payment", { kind: "review_rhe_payment" }, "Confirmar cobro"],
		[
			"classify_fourth_activity",
			{ kind: "classify_fourth_activity", documentId: "document-1" },
			"Revisar actividad",
		],
		["resolve_employment_coverage", { kind: "resolve_employment_coverage" }, "Revisar cruce"],
		["verify_deduction", { kind: "verify_deduction" }, "Verificar gasto"],
		["review_monthly_fourth", { kind: "review_monthly_fourth", period: "2026-08" }, "Revisar mes"],
	] as const)("uses a concrete action label for %s", (itemType, action, expected) => {
		const projected = projectHome(
			homeFixture({
				attention: {
					count: 1,
					nextItem: {
						id: "attention-1",
						itemType,
						title: "Revisa este dato",
						description: "Puede cambiar tu estimación.",
						action,
					},
				},
			}),
		);

		expect((projected.attention as { actionLabel?: string } | null)?.actionLabel).toBe(expected);
	});

	it("uses calm non-compliance language when there is no urgent action", () => {
		const projected = projectHome(
			homeFixture({
				attention: { count: 0, nextItem: null },
				workIncome: null,
				deductions: null,
				coverage: null,
			}),
		);

		expect(projected.hero.title).toBe("Estimación actualizada");
		expect(projected.hero.description).toBe("Con tus datos registrados hasta hoy.");
		expect(projected.sectionOrder).toEqual([]);
		expect(`${projected.hero.title} ${projected.hero.description}`.toLowerCase()).not.toContain(
			"al día",
		);
	});

	it("keeps the first-income CTA and honest copy when data is insufficient", () => {
		const projected = projectHome(
			homeFixture({
				status: "insufficient_data",
				primary: {
					code: "ADD_FIRST_INCOME",
					title: "Completa tus ingresos",
					description: "Registra un ingreso para preparar tu estimación.",
					action: { kind: "open_tax_income", incomeMode: "mixed" },
				},
				attention: { count: 0, nextItem: null },
				workIncome: null,
				deductions: null,
				coverage: null,
				taxSummary: null,
			}),
		);

		expect(projected.primaryAction).toEqual({ kind: "open_tax_income", incomeMode: "mixed" });
		expect(projected.hero).toMatchObject({
			eyebrow: "EMPIEZA AQUÍ",
			title: "Completa tus ingresos",
		});
		expect(JSON.stringify(projected.hero)).not.toMatch(/estimaci.n actualizada/i);
	});

	it("keeps included and potential deductions independent and names their evidence", () => {
		const projected = projectHome(homeFixture());

		expect(projected.deductions).toEqual({
			includedAmount: "850.00",
			potentialAmount: "320.00",
			unknownCount: 2,
			verificationLabel: "Confirmado por ti · Con evidencia adjunta",
		});
	});

	it("passes through the backend annual difference without calculating it on mobile", () => {
		const projected = projectHome(
			homeFixture({
				taxSummary: {
					evaluationId: "evaluation-1",
					calculatedAt: "2026-08-23T12:00:00.000Z",
					grossFourthIncome: "12000.00",
					calculatedTaxBeforeAdditionalDeductions: "900.00",
					registeredWithholdings: "600.00",
					differenceAfterRegisteredWithholdings: "300.00",
					includedIncomeCount: 4,
				},
			}),
		);

		expect(
			(projected as typeof projected & { annualDifference?: string | null }).annualDifference,
		).toBe("300.00");
	});

	it("marks the annual view as partial when coverage or exclusions are incomplete", () => {
		const projected = projectHome(homeFixture());

		expect(projected.coverage).toMatchObject({
			headline: "Estimación parcial",
			description: "Hay información que todavía puede cambiar el resultado anual.",
			incomeLabel: "Ingresos: completos según lo registrado",
			deductionLabel: "Gastos deducibles: todavía faltan datos",
			monthlyLabel: "Meses de cuarta: completos según lo registrado",
		});
		expect(projected.coverage?.excludedFactorLabels).toEqual([
			"Konti todavía no determina si debes presentar la declaración anual.",
		]);
		expect(JSON.stringify(projected.coverage).toLowerCase()).not.toContain("definitivo");
	});

	it("treats monthly not-applicable as complete enough for a fifth-only profile", () => {
		const projected = projectHome(
			homeFixture({
				coverage: {
					incomeCoverage: "complete",
					deductionCoverage: "complete",
					monthlyCoverage: "not_applicable",
					excludedFactors: [],
				},
			}),
		);

		expect(projected.coverage).toMatchObject({
			headline: "Alcance de la estimación",
			monthlyLabel: "Meses de cuarta: no aplica para tu perfil",
		});
	});

	it("treats unknown monthly coverage as incomplete", () => {
		const projected = projectHome(
			homeFixture({
				coverage: {
					incomeCoverage: "complete",
					deductionCoverage: "complete",
					monthlyCoverage: "unknown" as never,
					excludedFactors: [],
				},
			}),
		);

		expect(projected.coverage?.headline).toBe("Estimación parcial");
	});
});

describe("beginner-first Home copy", () => {
	it.each([
		["foreign_source_income", "Ingresos del extranjero no incluidos."],
		["prior_year_credit_balance", "Saldos a favor de años anteriores no incluidos."],
		["rent_attribution", "Atribución de alquiler entre pareja o cónyuges no incluida."],
		["other_annual_credit", "Otros créditos anuales no incluidos."],
		[
			"annual_filing_obligation_not_determined",
			"Konti todavía no determina si debes presentar la declaración anual.",
		],
		["known_unregistered_information", "Hay información que nos dijiste que aún no registraste."],
	] as const)("explains %s without tax jargon", (factor, expected) => {
		expect(homeExcludedFactorCopy(factor)).toBe(expected);
	});

	it.each([
		["user_confirmed", "Confirmado por ti"],
		["evidence_attached", "Con evidencia adjunta"],
		["system_verified", "Verificado mediante integración oficial"],
	] as const)("explains verification source %s", (status, expected) => {
		expect(homeVerificationStatusCopy(status)).toBe(expected);
	});

	it("provides accessible loading, empty and retry copy", () => {
		expect(homeLoadStateCopy("loading")).toBe("Preparando tu inicio…");
		expect(homeLoadStateCopy("error")).toBe(
			"No pudimos cargar tu inicio. Revisa tu conexión e inténtalo de nuevo.",
		);
		expect(homeLoadStateCopy("empty")).toBe("Con tus datos registrados hasta hoy.");
		expect(homeLoadStateCopy("refresh_error" as never)).toBe(
			"No pudimos actualizar. Sigues viendo la información guardada.",
		);
	});
});
