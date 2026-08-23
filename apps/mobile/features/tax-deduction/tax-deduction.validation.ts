import { z } from "zod";

import { isDateOnly, todayDateOnlyInLima } from "@/shared/date-only";

import { deriveRequestedDeductionStatus } from "./tax-deduction-state";
import type {
	DeductionQuestionState,
	DeductionRequirementCode,
	DeductionRequirementStatus,
	SaveTaxDeductionInput,
	TaxDeductionCategory,
} from "./types";

const categories = [
	"restaurants_hotels",
	"medical_dental_services",
	"other_fourth_services",
	"rent",
	"household_worker_essalud",
] as const;
const triState = z.enum(["yes", "no", "unknown"]);
const bankingState = z.enum(["yes", "no", "unknown", "not_applicable"]);
const verificationBasis = z.enum(["unresolved", "user_confirmation", "evidence_attached"]);
const medicalBeneficiary = z.enum([
	"self",
	"spouse",
	"accredited_partner",
	"minor_child",
	"adult_child_with_registered_disability",
	"adult_child_without_registered_disability",
	"other",
	"unknown",
]);
const fourthActivityType = z.enum(["ordinary", "special", "unknown"]);
const rentAttribution = z.enum(["taxpayer", "spouse_or_partner", "unknown"]);

function normalizeMoney(value: string): string | null {
	const normalizedSeparator = value.trim().replace(",", ".");
	if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(normalizedSeparator)) return null;
	const [whole = "0", fraction = ""] = normalizedSeparator.split(".");
	return `${whole}.${fraction.padEnd(2, "0")}`;
}

function moneyCents(value: string): bigint | null {
	const normalized = normalizeMoney(value);
	if (normalized === null) return null;
	return BigInt(normalized.replace(".", ""));
}

const moneyInput = z
	.string()
	.trim()
	.refine(
		(value) => normalizeMoney(value) !== null,
		"Ingresa un monto válido con hasta 2 decimales.",
	)
	.transform((value) => normalizeMoney(value) ?? value)
	.refine((value) => (moneyCents(value) ?? 0n) > 0n, "El gasto debe ser mayor que cero.");

const optionalMoneyInput = z
	.string()
	.trim()
	.refine(
		(value) => value === "" || normalizeMoney(value) !== null,
		"Ingresa un monto válido con hasta 2 decimales.",
	)
	.transform((value) => (value === "" ? "" : (normalizeMoney(value) ?? value)));

export function createTaxDeductionFormSchema(now = new Date()) {
	const today = todayDateOnlyInLima(now);
	return z
		.object({
			category: z.enum(categories),
			paidAt: z
				.string()
				.refine(isDateOnly, "Ingresa una fecha válida.")
				.refine(
					(value) => value >= "2026-01-01" && value <= "2026-12-31",
					"La fecha de pago debe corresponder a 2026.",
				)
				.refine((value) => value <= today, "La fecha de pago no puede estar en el futuro."),
			grossAmountPen: moneyInput,
			verificationBasis,
			sourceDocumentId: z.string().trim().min(1).nullable(),
			consumerDni: z.string().trim(),
			hasStoredIdentity: z.boolean(),
			medicalBeneficiary,
			insuranceReimbursementAmountPen: optionalMoneyInput,
			fourthActivityType,
			rentAttribution,
			acceptedDocument: triState,
			consumerIdentity: triState,
			paymentRecorded: triState,
			economicActivityCompatible: triState,
			issuerStatus: triState,
			issuedIn2026: triState,
			bankingEvidenceWhenRequired: bankingState,
			fourthCategoryReceipt: triState,
			professionRegistered: triState,
			beneficiaryIdentity: triState,
			issuerEligible: triState,
			propertyInPeru: triState,
			propertyNotExclusivelyBusinessUse: triState,
			workerRegistration: triState,
			form1676Evidence: triState,
		})
		.strict()
		.superRefine((value, context) => {
			if (value.consumerDni.length > 0 && !/^\d{8}$/.test(value.consumerDni)) {
				context.addIssue({
					code: "custom",
					path: ["consumerDni"],
					message: "Ingresa los 8 dígitos de tu DNI.",
				});
			}
			const needsIdentity =
				value.category !== "household_worker_essalud" &&
				value.verificationBasis !== "unresolved" &&
				!value.hasStoredIdentity;
			if (needsIdentity && !/^\d{8}$/.test(value.consumerDni)) {
				context.addIssue({
					code: "custom",
					path: ["consumerDni"],
					message: "Ingresa los 8 dígitos de tu DNI.",
				});
			}
			if (value.verificationBasis === "evidence_attached" && value.sourceDocumentId === null) {
				context.addIssue({
					code: "custom",
					path: ["verificationBasis"],
					message: "Adjunta evidencia antes de elegir esta opción.",
				});
			}
			if (
				value.category === "medical_dental_services" &&
				value.insuranceReimbursementAmountPen !== ""
			) {
				const reimbursement = moneyCents(value.insuranceReimbursementAmountPen);
				const gross = moneyCents(value.grossAmountPen);
				if (reimbursement !== null && gross !== null && reimbursement > gross) {
					context.addIssue({
						code: "custom",
						path: ["insuranceReimbursementAmountPen"],
						message: "El reembolso del seguro no puede superar el gasto.",
					});
				}
			}
		});
}

export type TaxDeductionFormInput = z.input<ReturnType<typeof createTaxDeductionFormSchema>>;
export type TaxDeductionFormValues = z.output<ReturnType<typeof createTaxDeductionFormSchema>>;

type FormStateKey = {
	[K in keyof TaxDeductionFormValues]: TaxDeductionFormValues[K] extends DeductionQuestionState
		? K
		: never;
}[keyof TaxDeductionFormValues];

const requirementFields: Record<
	TaxDeductionCategory,
	readonly Readonly<{ field: FormStateKey; code: DeductionRequirementCode }>[]
> = {
	restaurants_hotels: [
		{ field: "acceptedDocument", code: "accepted_document" },
		{ field: "consumerIdentity", code: "consumer_identity_correct" },
		{ field: "paymentRecorded", code: "payment_recorded" },
		{ field: "economicActivityCompatible", code: "compatible_economic_activity" },
		{ field: "issuerStatus", code: "issuer_active_and_habido" },
		{ field: "issuedIn2026", code: "issued_in_tax_year" },
		{ field: "bankingEvidenceWhenRequired", code: "banking_evidence_when_required" },
	],
	medical_dental_services: [
		{ field: "fourthCategoryReceipt", code: "fourth_category_receipt" },
		{ field: "professionRegistered", code: "profession_registered" },
		{ field: "beneficiaryIdentity", code: "beneficiary_identity_correct" },
		{ field: "paymentRecorded", code: "payment_recorded" },
		{ field: "issuerEligible", code: "issuer_eligible" },
		{ field: "bankingEvidenceWhenRequired", code: "banking_evidence_when_required" },
	],
	other_fourth_services: [
		{ field: "fourthCategoryReceipt", code: "fourth_category_receipt" },
		{ field: "consumerIdentity", code: "consumer_identity_correct" },
		{ field: "paymentRecorded", code: "payment_recorded" },
		{ field: "issuerEligible", code: "issuer_eligible" },
		{ field: "bankingEvidenceWhenRequired", code: "banking_evidence_when_required" },
	],
	rent: [
		{ field: "acceptedDocument", code: "accepted_rent_document" },
		{ field: "consumerIdentity", code: "consumer_identity_correct" },
		{ field: "paymentRecorded", code: "payment_recorded" },
		{ field: "propertyInPeru", code: "property_in_peru" },
		{
			field: "propertyNotExclusivelyBusinessUse",
			code: "property_not_exclusively_business_use",
		},
		{ field: "issuerStatus", code: "issuer_active_and_habido" },
		{ field: "bankingEvidenceWhenRequired", code: "banking_evidence_when_required" },
	],
	household_worker_essalud: [
		{ field: "workerRegistration", code: "worker_registration" },
		{ field: "form1676Evidence", code: "form_1676_evidence" },
		{ field: "paymentRecorded", code: "payment_recorded" },
	],
};

const requirementStatus: Record<DeductionQuestionState, DeductionRequirementStatus> = {
	yes: "met",
	no: "not_met",
	unknown: "unknown",
	not_applicable: "not_applicable",
};

const allowedMedicalBeneficiaries = new Set([
	"self",
	"spouse",
	"accredited_partner",
	"minor_child",
	"adult_child_with_registered_disability",
]);

function extraDispositionStates(values: TaxDeductionFormValues): DeductionQuestionState[] {
	if (values.category === "medical_dental_services") {
		const beneficiaryState =
			values.medicalBeneficiary === "unknown"
				? "unknown"
				: allowedMedicalBeneficiaries.has(values.medicalBeneficiary)
					? "yes"
					: "no";
		const gross = moneyCents(values.grossAmountPen);
		const reimbursement = moneyCents(values.insuranceReimbursementAmountPen);
		const reimbursementState =
			values.insuranceReimbursementAmountPen === ""
				? "unknown"
				: gross !== null && reimbursement === gross
					? "no"
					: "yes";
		return [beneficiaryState, reimbursementState];
	}
	if (values.category === "other_fourth_services") {
		return [
			values.fourthActivityType === "ordinary"
				? "yes"
				: values.fourthActivityType === "special"
					? "no"
					: "unknown",
		];
	}
	if (values.category === "rent") {
		return [values.rentAttribution === "taxpayer" ? "yes" : "unknown"];
	}
	return [];
}

export function taxDeductionSubmissionFromValues(
	values: TaxDeductionFormValues,
	idempotencyKey: string,
	deductionId?: string,
): SaveTaxDeductionInput {
	const fields = requirementFields[values.category];
	const requirements = fields.map(({ field, code }) => ({
		code,
		status: requirementStatus[values[field] as DeductionQuestionState],
	}));
	const requirementStates = fields.map(({ field }) => values[field] as DeductionQuestionState);
	const requestedCalculationStatus = deriveRequestedDeductionStatus({
		verificationBasis: values.verificationBasis,
		requirementStates: [...requirementStates, ...extraDispositionStates(values)],
	});

	return {
		mode: deductionId ? "update" : "create",
		...(deductionId ? { deductionId } : {}),
		identity:
			values.consumerDni.length === 8 && !values.hasStoredIdentity
				? { dni: values.consumerDni }
				: null,
		deduction: {
			category: values.category,
			paidAt: values.paidAt,
			grossAmountPen: values.grossAmountPen,
			verificationBasis: values.verificationBasis,
			sourceDocumentId: values.sourceDocumentId,
			idempotencyKey,
			requestedCalculationStatus,
			requirements,
			medical:
				values.category === "medical_dental_services"
					? {
							beneficiary: values.medicalBeneficiary,
							insuranceReimbursementAmountPen:
								values.insuranceReimbursementAmountPen === ""
									? null
									: values.insuranceReimbursementAmountPen,
						}
					: null,
			fourthActivityType:
				values.category === "other_fourth_services" ? values.fourthActivityType : null,
			rentAttribution: values.category === "rent" ? values.rentAttribution : null,
		},
	};
}
