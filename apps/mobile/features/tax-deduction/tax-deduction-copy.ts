import type {
	DeductionCalculationStatus,
	DeductionQuestion,
	DeductionVerificationStatus,
	TaxDeductionCategory,
} from "./types";

export const categoryCopy: Record<
	TaxDeductionCategory,
	Readonly<{ title: string; shortTitle: string; rateExplanation: string }>
> = {
	restaurants_hotels: {
		title: "Restaurantes, bares y hoteles",
		shortTitle: "Restaurante u hotel",
		rateExplanation: "El servidor puede considerar el 15% del gasto que cumpla los requisitos.",
	},
	medical_dental_services: {
		title: "Médicos y odontólogos",
		shortTitle: "Médico u odontólogo",
		rateExplanation:
			"El servidor puede considerar el 30% de la parte pagada que no reembolsó el seguro.",
	},
	other_fourth_services: {
		title: "Otros servicios independientes",
		shortTitle: "Otro servicio",
		rateExplanation:
			"El servidor puede considerar el 30% de servicios ordinarios sustentados con recibo por honorarios.",
	},
	rent: {
		title: "Alquiler de vivienda",
		shortTitle: "Alquiler",
		rateExplanation: "El servidor puede considerar el 30% del alquiler que cumpla los requisitos.",
	},
	household_worker_essalud: {
		title: "EsSalud de trabajador del hogar",
		shortTitle: "EsSalud del hogar",
		rateExplanation:
			"El servidor puede considerar el 100% del aporte a EsSalud acreditado para el trabajador del hogar.",
	},
};

export function deductionVerificationCopy(status: DeductionVerificationStatus): string {
	if (status === "unknown") return "Aún no sabemos con qué respaldo cuenta.";
	if (status === "user_confirmed") return "Lo confirmaste tú en Konti.";
	if (status === "evidence_attached") return "Se registró con la evidencia que adjuntaste.";
	return "Cuenta con una verificación disponible en el sistema.";
}

export function deductionCalculationCopy(status: DeductionCalculationStatus): string {
	if (status === "included") return "Incluido en esta estimación con los datos registrados.";
	if (status === "potential") return "Podría ayudarte, pero falta revisar información.";
	return "No se incluye en esta estimación.";
}

const MONEY_FORMAT = new Intl.NumberFormat("es-PE", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

function money(value: string): string {
	const parsed = Number(value);
	return `S/ ${MONEY_FORMAT.format(Number.isFinite(parsed) ? parsed : 0)}`;
}

export function deductionCapCopy(input: {
	capPen: string;
	amountDiscardedByCapPen: string;
}): string {
	const base = `El límite de ${money(input.capPen)} se comparte entre todas las categorías, no se repite por cada gasto.`;
	if (Number(input.amountDiscardedByCapPen) <= 0) return base;
	return `${base} ${money(input.amountDiscardedByCapPen)} quedó fuera por alcanzar ese límite.`;
}

const TRI_STATE = true;

const sharedQuestions = {
	paymentRecorded: {
		id: "paymentRecorded",
		title: "¿Este gasto ya fue pagado?",
		body: "La fecha pactada no reemplaza la fecha en que realmente se pagó.",
		allowsUnknown: TRI_STATE,
	},
	bankingEvidenceWhenRequired: {
		id: "bankingEvidenceWhenRequired",
		title: "Si el monto lo exigía, ¿usaste un medio de pago bancario?",
		body: "Para montos menores también puedes elegir “No aplica”. Si dudas, déjalo por revisar.",
		allowsUnknown: TRI_STATE,
	},
} as const satisfies Record<string, DeductionQuestion>;

export function requirementQuestionsForCategory(
	category: TaxDeductionCategory,
): readonly DeductionQuestion[] {
	if (category === "restaurants_hotels") {
		return [
			question(
				"acceptedDocument",
				"¿Tienes un comprobante admitido?",
				"Usa lo que figura en el comprobante que guardaste.",
			),
			question(
				"consumerIdentity",
				"¿Tu DNI figura como consumidor?",
				"Debe aparecer en el campo destinado a identificar al cliente.",
			),
			sharedQuestions.paymentRecorded,
			question(
				"economicActivityCompatible",
				"¿El negocio figura como restaurante, bar u hotel?",
				"No lo deduzcas por el nombre comercial si no estás seguro.",
			),
			question(
				"issuerStatus",
				"¿El emisor estaba activo y habido?",
				"Si no lo verificaste, elige “No estoy seguro”.",
			),
			question(
				"issuedIn2026",
				"¿El comprobante fue emitido en 2026?",
				"Este flujo prepara la estimación del ejercicio 2026.",
			),
			sharedQuestions.bankingEvidenceWhenRequired,
		];
	}
	if (category === "medical_dental_services") {
		return [
			question(
				"fourthCategoryReceipt",
				"¿Tienes un recibo por honorarios?",
				"Este gasto necesita un RHE del profesional.",
			),
			question(
				"professionRegistered",
				"¿El emisor figura como médico u odontólogo?",
				"Si no lo comprobaste, puede quedar pendiente.",
			),
			question(
				"medicalBeneficiary",
				"¿Para quién fue la atención?",
				"Puede ser para ti o para determinados familiares admitidos.",
			),
			question(
				"beneficiaryIdentity",
				"¿El beneficiario está identificado correctamente?",
				"El parentesco y la identidad se revisan por separado.",
			),
			question(
				"insuranceReimbursementAmountPen",
				"¿Cuánto reembolsó el seguro?",
				"Escribe cero si no hubo reembolso o déjalo vacío si aún no lo sabes.",
			),
			sharedQuestions.paymentRecorded,
			question(
				"issuerEligible",
				"¿El emisor cumplía su condición tributaria?",
				"No lo marques como sí si solo lo infirió el OCR.",
			),
			sharedQuestions.bankingEvidenceWhenRequired,
		];
	}
	if (category === "other_fourth_services") {
		return [
			question(
				"fourthCategoryReceipt",
				"¿Tienes un recibo por honorarios?",
				"Debe sustentar el servicio que pagaste.",
			),
			question(
				"fourthActivityType",
				"¿Fue un servicio independiente ordinario?",
				"Director, síndico y actividades similares no entran en esta deducción.",
			),
			question(
				"consumerIdentity",
				"¿Tu DNI figura correctamente?",
				"Si todavía no lo revisaste, déjalo pendiente.",
			),
			sharedQuestions.paymentRecorded,
			question(
				"issuerEligible",
				"¿El emisor cumplía su condición tributaria?",
				"Konti no lo confirma solo con el comprobante.",
			),
			sharedQuestions.bankingEvidenceWhenRequired,
		];
	}
	if (category === "rent") {
		return [
			question(
				"acceptedDocument",
				"¿Tienes Formulario 1683 o factura electrónica?",
				"El documento depende del tipo de arrendador.",
			),
			question(
				"propertyInPeru",
				"¿El inmueble está en Perú?",
				"Esta estimación solo contempla inmuebles ubicados en Perú.",
			),
			question(
				"propertyNotExclusivelyBusinessUse",
				"¿El inmueble no se usa exclusivamente para un negocio?",
				"Si no conoces el uso exacto, deja este dato pendiente.",
			),
			question(
				"rentAttribution",
				"¿El alquiler te corresponde a ti?",
				"No inferimos una atribución a cónyuge o pareja por domicilio o apellido.",
			),
			question(
				"consumerIdentity",
				"¿Tu DNI figura correctamente?",
				"Revisa el documento de alquiler.",
			),
			sharedQuestions.paymentRecorded,
			question(
				"issuerStatus",
				"¿El emisor estaba activo y habido?",
				"Si no lo verificaste, elige “No estoy seguro”.",
			),
			sharedQuestions.bankingEvidenceWhenRequired,
		];
	}
	return [
		question(
			"workerRegistration",
			"¿El trabajador del hogar estaba registrado?",
			"Si aún no lo comprobaste, deja la respuesta pendiente.",
		),
		question(
			"form1676Evidence",
			"¿Tienes evidencia del Formulario 1676?",
			"Se necesita el aporte acreditado, no el sueldo del trabajador.",
		),
		sharedQuestions.paymentRecorded,
	];
}

function question(id: DeductionQuestion["id"], title: string, body: string): DeductionQuestion {
	return { id, title, body, allowsUnknown: true };
}
