import {
	createTaxDeductionSchema,
	documentTaxDeductionDecisionSchema,
	updateTaxDeductionSchema,
} from "./tax-deduction.validation";

const now = new Date("2026-08-23T18:00:00.000Z");
const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const sourceDocumentId = "33333333-3333-4333-8333-333333333333";

const restaurant = {
	category: "restaurants_hotels" as const,
	paidAt: "2026-08-20",
	grossAmountPen: "100",
	verificationBasis: "user_confirmation" as const,
	requestedCalculationStatus: "included" as const,
	requirements: [
		{ code: "accepted_document", status: "met" },
		{ code: "consumer_identity_correct", status: "met" },
		{ code: "payment_recorded", status: "met" },
		{ code: "compatible_economic_activity", status: "met" },
		{ code: "issuer_active_and_habido", status: "met" },
		{ code: "issued_in_tax_year", status: "met" },
		{ code: "banking_evidence_when_required", status: "not_applicable" },
	],
	medical: null,
	fourthActivityType: null,
	rentAttribution: null,
};

describe("tax deduction validation", () => {
	it("accepts an optional DNI only on the authenticated deduction command", () => {
		const result = createTaxDeductionSchema(new Date("2026-08-23T12:00:00.000Z")).safeParse({
			...restaurant,
			sourceDocumentId: null,
			idempotencyKey,
			consumerDni: "12345678",
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.consumerDni).toBe("12345678");
	});
	it("parses the mobile contract and normalizes money without accepting server-owned fields", () => {
		expect(
			createTaxDeductionSchema(now).parse({
				...restaurant,
				sourceDocumentId: null,
				idempotencyKey,
			}),
		).toMatchObject({ grossAmountPen: "100.00", verificationBasis: "user_confirmation" });
		expect(
			createTaxDeductionSchema(now).safeParse({
				...restaurant,
				sourceDocumentId: null,
				idempotencyKey,
				verificationStatus: "system_verified",
			}),
		).toMatchObject({ success: false });
	});

	it("accepts not_applicable only for the banking requirement", () => {
		expect(
			createTaxDeductionSchema(now).safeParse({
				...restaurant,
				sourceDocumentId: null,
				idempotencyKey,
			}),
		).toMatchObject({ success: true });
		expect(
			createTaxDeductionSchema(now).safeParse({
				...restaurant,
				requirements: restaurant.requirements.map((requirement) =>
					requirement.code === "accepted_document"
						? { ...requirement, status: "not_applicable" }
						: requirement,
				),
				sourceDocumentId: null,
				idempotencyKey,
			}),
		).toMatchObject({ success: false });
	});

	it("validates medical beneficiary and reimbursement in the canonical nested shape", () => {
		const input = {
			category: "medical_dental_services" as const,
			paidAt: "2026-08-20",
			grossAmountPen: "1000",
			verificationBasis: "evidence_attached" as const,
			requestedCalculationStatus: "included" as const,
			requirements: [
				{ code: "fourth_category_receipt", status: "met" },
				{ code: "profession_registered", status: "met" },
				{ code: "beneficiary_identity_correct", status: "met" },
				{ code: "payment_recorded", status: "met" },
				{ code: "issuer_eligible", status: "met" },
				{ code: "banking_evidence_when_required", status: "met" },
			],
			medical: { beneficiary: "spouse" as const, insuranceReimbursementAmountPen: "200.5" },
			fourthActivityType: null,
			rentAttribution: null,
			sourceDocumentId,
			idempotencyKey,
		};
		expect(updateTaxDeductionSchema(now).parse(input)).toMatchObject({
			medical: { insuranceReimbursementAmountPen: "200.50" },
		});
		expect(
			updateTaxDeductionSchema(now).safeParse({
				...input,
				medical: { ...input.medical, insuranceReimbursementAmountPen: "1000.01" },
			}),
		).toMatchObject({ success: false });
	});

	it("requires an explicit 2026 paidAt instead of accepting issueDate", () => {
		expect(
			createTaxDeductionSchema(now).safeParse({
				...restaurant,
				paidAt: "",
				issueDate: "2026-08-20",
				sourceDocumentId: null,
				idempotencyKey,
			}),
		).toMatchObject({ success: false });
	});

	it("accepts an included document intention but keeps derivation server-owned", () => {
		expect(
			documentTaxDeductionDecisionSchema(now).parse({
				...restaurant,
				verificationBasis: "evidence_attached",
				documentId: sourceDocumentId,
				decision: "deduction_confirmed",
			}),
		).toMatchObject({
			verificationBasis: "evidence_attached",
			requestedCalculationStatus: "included",
		});
	});
});
