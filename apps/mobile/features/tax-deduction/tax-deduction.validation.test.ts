import { describe, expect, it } from "vitest";

import {
	createTaxDeductionFormSchema,
	taxDeductionSubmissionFromValues,
} from "./tax-deduction.validation";
import { deductionFormDefaults, deductionFormSteps } from "./tax-deduction-form";
import type { TaxDeductionRecord } from "./types";

const allMet = {
	acceptedDocument: "yes",
	consumerIdentity: "yes",
	paymentRecorded: "yes",
	economicActivityCompatible: "yes",
	issuerStatus: "yes",
	issuedIn2026: "yes",
	bankingEvidenceWhenRequired: "yes",
	fourthCategoryReceipt: "yes",
	professionRegistered: "yes",
	beneficiaryIdentity: "yes",
	issuerEligible: "yes",
	propertyInPeru: "yes",
	propertyNotExclusivelyBusinessUse: "yes",
	workerRegistration: "yes",
	form1676Evidence: "yes",
} as const;

function baseValues() {
	return {
		category: "restaurants_hotels" as const,
		paidAt: "2026-08-20",
		grossAmountPen: "120.00",
		verificationBasis: "user_confirmation" as const,
		sourceDocumentId: null,
		consumerDni: "12345678",
		hasStoredIdentity: false,
		medicalBeneficiary: "unknown" as const,
		insuranceReimbursementAmountPen: "",
		fourthActivityType: "unknown" as const,
		rentAttribution: "unknown" as const,
		...allMet,
	};
}

describe("tax deduction validation", () => {
	it("builds a one-question-at-a-time flow with medical beneficiary and reimbursement separated", () => {
		const steps = deductionFormSteps("medical_dental_services", {
			hasStoredIdentity: false,
		});
		const ids = steps.map((step) => step.id);

		expect(ids.slice(0, 5)).toEqual([
			"category",
			"grossAmountPen",
			"paidAt",
			"verificationBasis",
			"consumerDni",
		]);
		expect(ids.indexOf("medicalBeneficiary")).toBeLessThan(
			ids.indexOf("insuranceReimbursementAmountPen"),
		);
	});

	it("does not ask for a contextual DNI after one is already stored", () => {
		const steps = deductionFormSteps("rent", { hasStoredIdentity: true });

		expect(steps.map((step) => step.id)).not.toContain("consumerDni");
	});

	it("starts new records with unresolved verification and unknown requirements", () => {
		const defaults = deductionFormDefaults({
			category: "restaurants_hotels",
			hasStoredIdentity: false,
			sourceDocumentId: null,
			now: new Date("2026-07-02T04:30:00.000Z"),
		});

		expect(defaults.verificationBasis).toBe("unresolved");
		expect(defaults.acceptedDocument).toBe("unknown");
		expect(defaults.consumerDni).toBe("");
		expect(defaults.paidAt).toBe("2026-07-01");
	});

	it("prefills OCR amount and evidence but leaves the real payment date empty", () => {
		const defaults = deductionFormDefaults({
			category: "restaurants_hotels",
			hasStoredIdentity: true,
			sourceDocumentId: "document-1",
			prefillGrossAmountPen: "100.00",
			now: new Date("2026-07-02T04:30:00.000Z"),
		});

		expect(defaults.grossAmountPen).toBe("100.00");
		expect(defaults.verificationBasis).toBe("evidence_attached");
		expect(defaults.paidAt).toBe("");
	});

	it("preserves the real payment date when editing an existing deduction", () => {
		const record: TaxDeductionRecord = {
			id: "deduction-1",
			category: "restaurants_hotels",
			paidAt: "2026-05-14",
			grossAmountPen: "120.00",
			verificationStatus: "user_confirmed",
			calculationStatus: "included",
			sourceDocumentId: null,
			requirements: [],
			medical: null,
			fourthActivityType: null,
			rentAttribution: null,
			createdAt: "2026-05-14T18:00:00.000Z",
			updatedAt: "2026-05-14T18:00:00.000Z",
		};

		expect(
			deductionFormDefaults({
				category: "restaurants_hotels",
				hasStoredIdentity: true,
				sourceDocumentId: null,
				record,
				now: new Date("2026-07-02T04:30:00.000Z"),
			}).paidAt,
		).toBe("2026-05-14");
	});

	it.each(["2026-07-01", "2026-07-02"])(
		"keeps the selected civil payment date %s without shifting it",
		(paidAt) => {
			const parsed = createTaxDeductionFormSchema(new Date("2026-07-02T17:00:00.000Z")).parse({
				...baseValues(),
				paidAt,
			});

			expect(taxDeductionSubmissionFromValues(parsed, `request-${paidAt}`).deduction.paidAt).toBe(
				paidAt,
			);
		},
	);

	it.each([
		["2026-02-30", "Ingresa una fecha válida."],
		["2025-12-31", "La fecha de pago debe corresponder a 2026."],
		["2026-07-03", "La fecha de pago no puede estar en el futuro."],
	] as const)("rejects payment date %s", (paidAt, expectedMessage) => {
		const result = createTaxDeductionFormSchema(new Date("2026-07-02T17:00:00.000Z")).safeParse({
			...baseValues(),
			paidAt,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.paidAt).toContain(expectedMessage);
		}
	});

	it("accepts a restaurant only when the contextual identity and required facts are present", () => {
		const result = createTaxDeductionFormSchema().safeParse(baseValues());

		expect(result.success).toBe(true);
	});

	it("sends banking not_applicable as a resolved legal fact", () => {
		const parsed = createTaxDeductionFormSchema().parse({
			...baseValues(),
			bankingEvidenceWhenRequired: "not_applicable",
		});
		const submission = taxDeductionSubmissionFromValues(parsed, "banking-na-request");

		expect(submission.deduction.requirements).toContainEqual({
			code: "banking_evidence_when_required",
			status: "not_applicable",
		});
		expect(submission.deduction.requestedCalculationStatus).toBe("included");
	});

	it("requires an eight-digit DNI when a verified category has no stored identity", () => {
		const result = createTaxDeductionFormSchema().safeParse({
			...baseValues(),
			consumerDni: "1234",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.consumerDni).toContain(
				"Ingresa los 8 dígitos de tu DNI.",
			);
		}
	});

	it("keeps medical reimbursement and beneficiary separate and rejects an impossible reimbursement", () => {
		const result = createTaxDeductionFormSchema().safeParse({
			...baseValues(),
			category: "medical_dental_services",
			grossAmountPen: "100.00",
			medicalBeneficiary: "spouse",
			insuranceReimbursementAmountPen: "120.00",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.insuranceReimbursementAmountPen).toContain(
				"El reembolso del seguro no puede superar el gasto.",
			);
		}
	});

	it("does not allow evidence-attached verification without an existing document", () => {
		const result = createTaxDeductionFormSchema().safeParse({
			...baseValues(),
			verificationBasis: "evidence_attached",
			sourceDocumentId: null,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.verificationBasis).toContain(
				"Adjunta evidencia antes de elegir esta opción.",
			);
		}
	});

	it("sends the DNI only to the identity request and never inside the deduction payload", () => {
		const parsed = createTaxDeductionFormSchema().parse(baseValues());
		const submission = taxDeductionSubmissionFromValues(parsed, "deduction-request-1");

		expect(submission.identity).toEqual({ dni: "12345678" });
		expect(submission.deduction).not.toHaveProperty("consumerDni");
		expect(JSON.stringify(submission.deduction)).not.toContain("12345678");
		expect(submission.deduction.verificationBasis).toBe("user_confirmation");
	});

	it("turns unknown rent attribution into a potential record instead of included", () => {
		const parsed = createTaxDeductionFormSchema().parse({
			...baseValues(),
			category: "rent",
			rentAttribution: "unknown",
		});
		const submission = taxDeductionSubmissionFromValues(parsed, "rent-request-1");

		expect(submission.deduction.requestedCalculationStatus).toBe("potential");
		expect(submission.deduction.rentAttribution).toBe("unknown");
	});

	it("keeps EsSalud potential when Form 1676 evidence is unknown", () => {
		const parsed = createTaxDeductionFormSchema().parse({
			...baseValues(),
			category: "household_worker_essalud",
			consumerDni: "",
			form1676Evidence: "unknown",
		});
		const submission = taxDeductionSubmissionFromValues(parsed, "essalud-request-1");

		expect(submission.deduction.requestedCalculationStatus).toBe("potential");
	});
});
