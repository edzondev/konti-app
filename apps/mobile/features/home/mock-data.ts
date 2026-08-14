import type {
	HomeAllClearContent,
	HomeDecisionReceipt,
	HomeMockProfile,
	HomeUiState,
	HomeUpcomingContent,
} from "@/features/home/types";

/** Mock UI dataset aligned with konti-design-v2-with-types. */
export const homeMockProfile: HomeMockProfile = {
	firstName: "Lucía",
	initials: "LM",
	incomeLabel: "Independiente",
	fiscalYear: "2026",
	profileStatus: "Necesita revisión",
	currency: "PEN",
	maskedRuc: "RUC ••••••780012",
};

export const homeAllClearContent: HomeAllClearContent = {
	heading: "RH Estudio Norte está listo.",
	explanation: "Factura · S/4200 · Listo",
	highlight: "Farmacia · S/48 · Analizando",
	linkLabel: "Ver comprobantes",
};

export const homeDecisionReceipt: HomeDecisionReceipt = {
	merchant: "Clínica",
	detail: "Fecha por confirmar",
	amount: "S/180",
	confirmLabel: "Confirmar fecha",
	reviewLabel: "Revisar boleta",
};

export const homeUpcomingContent: HomeUpcomingContent = {
	heading: "Evaluación anual en curso.",
	explanation: "Domicilio fiscal pendiente. Revisión anual 2026 · Pago único S/89.",
	suggestion: "Sugerencia: Mercado · S/48",
};

/** Default demo state for UI-only Home. */
export const defaultHomeUiState: HomeUiState = "needs-decision";

export const homeUiStateOrder: HomeUiState[] = [
	"new-user",
	"all-clear",
	"needs-decision",
	"upcoming",
];
