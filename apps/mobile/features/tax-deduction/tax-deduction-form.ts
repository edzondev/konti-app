import { todayDateOnlyInLima } from "@/shared/date-only";

import type { TaxDeductionFormInput } from "./tax-deduction.validation";
import { categoryCopy, requirementQuestionsForCategory } from "./tax-deduction-copy";
import type {
	DeductionQuestionId,
	DeductionQuestionState,
	TaxDeductionCategory,
	TaxDeductionRecord,
} from "./types";

export type DeductionFormStepId =
	| "category"
	| "grossAmountPen"
	| "paidAt"
	| "verificationBasis"
	| "consumerDni"
	| DeductionQuestionId;

export type DeductionFormStep = Readonly<{
	id: DeductionFormStepId;
	title: string;
	body: string;
	allowsUnknown: boolean;
}>;

export function deductionFormSteps(
	category: TaxDeductionCategory,
	options: Readonly<{ hasStoredIdentity: boolean }>,
): readonly DeductionFormStep[] {
	const base: DeductionFormStep[] = [
		{
			id: "category",
			title: "¿Qué tipo de gasto fue?",
			body: "Elige la opción que mejor describe lo que pagaste.",
			allowsUnknown: false,
		},
		{
			id: "grossAmountPen",
			title: "¿Cuánto pagaste?",
			body: "Registra el importe total pagado en soles. El servidor hará la estimación.",
			allowsUnknown: false,
		},
		{
			id: "paidAt",
			title: "¿Cuándo lo pagaste?",
			body: "Usa la fecha real de pago durante 2026.",
			allowsUnknown: false,
		},
		{
			id: "verificationBasis",
			title: "¿Con qué respaldo lo registras?",
			body: "Puedes confirmar que aparece en tu información de SUNAT, usar evidencia ya adjunta o dejarlo pendiente.",
			allowsUnknown: true,
		},
	];

	if (!options.hasStoredIdentity && category !== "household_worker_essalud") {
		base.push({
			id: "consumerDni",
			title: "¿Qué DNI debe figurar en el comprobante?",
			body: "Se envía aparte para protegerlo. Konti muestra después solo los últimos cuatro dígitos.",
			allowsUnknown: true,
		});
	}

	return [...base, ...requirementQuestionsForCategory(category)];
}

const unknownRequirementDefaults = {
	acceptedDocument: "unknown",
	consumerIdentity: "unknown",
	paymentRecorded: "unknown",
	economicActivityCompatible: "unknown",
	issuerStatus: "unknown",
	issuedIn2026: "unknown",
	bankingEvidenceWhenRequired: "unknown",
	fourthCategoryReceipt: "unknown",
	professionRegistered: "unknown",
	beneficiaryIdentity: "unknown",
	issuerEligible: "unknown",
	propertyInPeru: "unknown",
	propertyNotExclusivelyBusinessUse: "unknown",
	workerRegistration: "unknown",
	form1676Evidence: "unknown",
} as const satisfies Record<string, DeductionQuestionState>;

const requirementFieldByCode = {
	accepted_document: "acceptedDocument",
	accepted_rent_document: "acceptedDocument",
	consumer_identity_correct: "consumerIdentity",
	payment_recorded: "paymentRecorded",
	compatible_economic_activity: "economicActivityCompatible",
	issuer_active_and_habido: "issuerStatus",
	issued_in_tax_year: "issuedIn2026",
	banking_evidence_when_required: "bankingEvidenceWhenRequired",
	fourth_category_receipt: "fourthCategoryReceipt",
	profession_registered: "professionRegistered",
	beneficiary_identity_correct: "beneficiaryIdentity",
	issuer_eligible: "issuerEligible",
	property_in_peru: "propertyInPeru",
	property_not_exclusively_business_use: "propertyNotExclusivelyBusinessUse",
	worker_registration: "workerRegistration",
	form_1676_evidence: "form1676Evidence",
} as const;

function formRequirementState(
	status: "met" | "not_met" | "unknown" | "not_applicable",
): DeductionQuestionState {
	if (status === "met") return "yes";
	if (status === "not_met") return "no";
	if (status === "not_applicable") return "not_applicable";
	return "unknown";
}

function verificationBasis(record: TaxDeductionRecord | undefined) {
	if (!record || record.verificationStatus === "unknown") return "unresolved" as const;
	if (record.verificationStatus === "evidence_attached") return "evidence_attached" as const;
	if (record.verificationStatus === "system_verified" && record.sourceDocumentId) {
		return "evidence_attached" as const;
	}
	return "user_confirmation" as const;
}

export function deductionFormDefaults(
	options: Readonly<{
		category: TaxDeductionCategory;
		hasStoredIdentity: boolean;
		sourceDocumentId: string | null;
		prefillGrossAmountPen?: string | null;
		record?: TaxDeductionRecord;
		now?: Date;
	}>,
): TaxDeductionFormInput {
	const record = options.record;
	const defaults: TaxDeductionFormInput = {
		category: record?.category ?? options.category,
		paidAt:
			record?.paidAt ?? (options.sourceDocumentId === null ? todayDateOnlyInLima(options.now) : ""),
		grossAmountPen: record?.grossAmountPen ?? options.prefillGrossAmountPen ?? "",
		verificationBasis: record
			? verificationBasis(record)
			: options.sourceDocumentId
				? "evidence_attached"
				: "unresolved",
		sourceDocumentId: record?.sourceDocumentId ?? options.sourceDocumentId,
		consumerDni: "",
		hasStoredIdentity: options.hasStoredIdentity,
		medicalBeneficiary: record?.medical?.beneficiary ?? "unknown",
		insuranceReimbursementAmountPen: record?.medical?.insuranceReimbursementAmountPen ?? "",
		fourthActivityType: record?.fourthActivityType ?? "unknown",
		rentAttribution: record?.rentAttribution ?? "unknown",
		...unknownRequirementDefaults,
	};

	if (!record) return defaults;
	for (const requirement of record.requirements) {
		const field = requirementFieldByCode[requirement.code];
		const state = formRequirementState(requirement.status);
		if (field === "bankingEvidenceWhenRequired") {
			defaults[field] = state;
		} else {
			defaults[field] = state === "not_applicable" ? "unknown" : state;
		}
	}
	return defaults;
}

export function deductionCategoryTitle(category: TaxDeductionCategory): string {
	return categoryCopy[category].shortTitle;
}
