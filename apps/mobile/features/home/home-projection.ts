import type {
	HomeAttentionItem,
	HomeCoverage,
	HomeDeductionSummary,
	HomeDeductionVerificationStatus,
	HomeExcludedFactor,
	HomePrimaryAction,
	HomeResponse,
	HomeWorkIncomeSummary,
} from "./types";

export type HomeSectionId = "attention" | "work_income" | "deductions" | "coverage";

export type HomeHero = Readonly<{
	eyebrow: string;
	title: string;
	description: string;
	tone: "calm" | "attention";
}>;

export type HomeDeductionProjection = Readonly<{
	includedAmount: string;
	potentialAmount: string;
	unknownCount: number;
	verificationLabel: string;
}>;

export type HomeAttentionProjection = HomeAttentionItem &
	Readonly<{
		actionLabel: string;
	}>;

export type HomeCoverageProjection = Readonly<{
	headline: "Estimación parcial" | "Alcance de la estimación";
	description: string;
	incomeLabel: string;
	deductionLabel: string;
	monthlyLabel: string;
	excludedFactorLabels: readonly string[];
}>;

export type HomeProjection = Readonly<{
	hero: HomeHero;
	attention: HomeAttentionProjection | null;
	workIncome: HomeWorkIncomeSummary | null;
	deductions: HomeDeductionProjection | null;
	coverage: HomeCoverageProjection | null;
	annualDifference: string | null;
	monthlyOutstandingCount: number;
	primaryAction: HomePrimaryAction;
	sectionOrder: readonly HomeSectionId[];
	processedDocuments: number;
}>;

export function projectHome(home: HomeResponse): HomeProjection {
	const sourceAttention = home.attention.nextItem;
	const attention = sourceAttention
		? { ...sourceAttention, actionLabel: attentionActionLabel(sourceAttention) }
		: null;
	const workIncome = home.workIncome ?? legacyWorkIncome(home);
	const deductions = home.deductions ? projectDeductions(home.deductions) : null;
	const coverage = home.coverage ? projectCoverage(home.coverage) : null;
	const sectionOrder: HomeSectionId[] = [];
	if (attention) sectionOrder.push("attention");
	if (workIncome) sectionOrder.push("work_income");
	if (deductions) sectionOrder.push("deductions");
	if (coverage) sectionOrder.push("coverage");

	return {
		hero: homeHero(home, attention),
		attention,
		workIncome,
		deductions,
		coverage,
		annualDifference: home.taxSummary?.differenceAfterRegisteredWithholdings ?? null,
		monthlyOutstandingCount: home.monthlyOutstandingCount ?? 0,
		primaryAction: attention?.action ?? calmPrimaryAction(home),
		sectionOrder,
		processedDocuments: home.summary.processedDocuments,
	};
}

function attentionActionLabel(attention: HomeAttentionItem): string {
	switch (attention.itemType) {
		case "confirm_rhe_payment":
			return "Confirmar cobro";
		case "classify_fourth_activity":
			return "Revisar actividad";
		case "resolve_employment_coverage":
			return "Revisar cruce";
		case "verify_deduction":
			return "Verificar gasto";
		case "review_monthly_fourth":
			return "Revisar mes";
	}
}

function homeHero(home: HomeResponse, attention: HomeAttentionItem | null): HomeHero {
	if (attention) {
		return {
			eyebrow: "REQUIERE TU ATENCIÓN",
			title: "Empecemos por esto",
			description: "Te mostramos primero lo que puede cambiar tu estimación.",
			tone: "attention",
		};
	}

	if (
		(home.status === "starting" || home.status === "insufficient_data") &&
		isStartAction(home.primary.action)
	) {
		return {
			eyebrow: "EMPIEZA AQUÍ",
			title: home.primary.title,
			description: home.primary.description,
			tone: "calm",
		};
	}

	return {
		eyebrow: "TU SITUACIÓN",
		title: "Estimación actualizada",
		description: "Con tus datos registrados hasta hoy.",
		tone: "calm",
	};
}

function calmPrimaryAction(home: HomeResponse): HomePrimaryAction {
	if (
		(home.status === "starting" || home.status === "insufficient_data") &&
		isStartAction(home.primary.action)
	) {
		return home.primary.action;
	}
	return null;
}

function isStartAction(action: HomePrimaryAction): boolean {
	if (!action) return false;
	return (
		action === "open_capture" ||
		action === "open_tax_income" ||
		(typeof action === "object" && action.kind === "open_tax_income")
	);
}

function legacyWorkIncome(home: HomeResponse): HomeWorkIncomeSummary | null {
	if (!home.taxSummary) return null;
	return {
		fourthGrossAmount: home.taxSummary.grossFourthIncome,
		employmentGrossAmount: null,
	};
}

function projectDeductions(summary: HomeDeductionSummary): HomeDeductionProjection {
	const verificationLabels = Array.from(new Set(summary.includedVerificationStatuses)).map(
		homeVerificationStatusCopy,
	);
	return {
		includedAmount: summary.includedAmount,
		potentialAmount: summary.potentialAmount,
		unknownCount: summary.unknownCount,
		verificationLabel:
			verificationLabels.length > 0
				? verificationLabels.join(" · ")
				: "Fuente de verificación aún no detallada",
	};
}

function projectCoverage(coverage: HomeCoverage): HomeCoverageProjection {
	const isPartial =
		coverage.incomeCoverage !== "complete" ||
		coverage.deductionCoverage !== "complete" ||
		(coverage.monthlyCoverage !== "complete" && coverage.monthlyCoverage !== "not_applicable") ||
		coverage.excludedFactors.length > 0;

	return {
		headline: isPartial ? "Estimación parcial" : "Alcance de la estimación",
		description: isPartial
			? "Hay información que todavía puede cambiar el resultado anual."
			: "Esto resume únicamente lo que registraste en Konti.",
		incomeLabel: coverageLevelCopy("Ingresos", coverage.incomeCoverage),
		deductionLabel: coverageLevelCopy("Gastos deducibles", coverage.deductionCoverage),
		monthlyLabel:
			coverage.monthlyCoverage === "not_applicable"
				? "Meses de cuarta: no aplica para tu perfil"
				: coverageLevelCopy("Meses de cuarta", coverage.monthlyCoverage),
		excludedFactorLabels: coverage.excludedFactors.map(homeExcludedFactorCopy),
	};
}

function coverageLevelCopy(label: string, level: "complete" | "partial" | "unknown"): string {
	if (level === "complete") return `${label}: completos según lo registrado`;
	if (level === "partial") return `${label}: todavía faltan datos`;
	return `${label}: aún no sabemos si están completos`;
}

export function homeExcludedFactorCopy(factor: HomeExcludedFactor): string {
	switch (factor) {
		case "foreign_source_income":
			return "Ingresos del extranjero no incluidos.";
		case "prior_year_credit_balance":
			return "Saldos a favor de años anteriores no incluidos.";
		case "rent_attribution":
			return "Atribución de alquiler entre pareja o cónyuges no incluida.";
		case "other_annual_credit":
			return "Otros créditos anuales no incluidos.";
		case "annual_filing_obligation_not_determined":
			return "Konti todavía no determina si debes presentar la declaración anual.";
		case "known_unregistered_information":
			return "Hay información que nos dijiste que aún no registraste.";
	}
}

export function homeVerificationStatusCopy(status: HomeDeductionVerificationStatus): string {
	switch (status) {
		case "user_confirmed":
			return "Confirmado por ti";
		case "evidence_attached":
			return "Con evidencia adjunta";
		case "system_verified":
			return "Verificado mediante integración oficial";
	}
}

export function homeLoadStateCopy(state: "loading" | "error" | "refresh_error" | "empty"): string {
	if (state === "loading") return "Preparando tu inicio…";
	if (state === "error") {
		return "No pudimos cargar tu inicio. Revisa tu conexión e inténtalo de nuevo.";
	}
	if (state === "refresh_error") {
		return "No pudimos actualizar. Sigues viendo la información guardada.";
	}
	return "Con tus datos registrados hasta hoy.";
}
