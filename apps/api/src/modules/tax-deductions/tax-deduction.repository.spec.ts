import type { Database, DatabaseExecutor } from "../../database/database.types";
import type { CanonicalTaxDeductionInput } from "./tax-deduction.persistence.types";
import { TaxDeductionRepository } from "./tax-deduction.repository";

const input: CanonicalTaxDeductionInput = {
	category: "medical_dental_services",
	expenseDate: "2026-08-20",
	grossAmount: "1000.00",
	beneficiary: "self",
	insuranceReimbursementAmount: "200.00",
	fourthActivityType: null,
	attribution: null,
	verificationStatus: "evidence_attached",
	calculationStatus: "potential",
	requirements: [
		{ code: "fourth_category_receipt", status: "met" },
		{ code: "profession_registered", status: "met" },
		{ code: "beneficiary_identity_correct", status: "met" },
		{ code: "payment_recorded", status: "met" },
		{ code: "issuer_eligible", status: "unknown" },
		{ code: "banking_evidence_when_required", status: "met" },
	],
	notes: null,
};

describe("TaxDeductionRepository", () => {
	it("persists derived eligible base and typed medical facts", async () => {
		let inserted: Record<string, unknown> | undefined;
		const returning = jest.fn(async () => []);
		const onConflictDoNothing = jest.fn(() => ({ returning }));
		const values = jest.fn((next: Record<string, unknown>) => {
			inserted = next;
			return { onConflictDoNothing };
		});
		const executor = { insert: jest.fn(() => ({ values })) } as unknown as DatabaseExecutor;
		const repository = new TaxDeductionRepository({} as Database);

		await repository.insert(executor, {
			taxProfileId: "11111111-1111-4111-8111-111111111111",
			sourceDocumentId: "33333333-3333-4333-8333-333333333333",
			source: "document",
			idempotencyKey: null,
			input,
			eligibleBase: "800.00",
			attentionReasons: ["requirement_unknown:issuer_eligible"],
		});

		expect(inserted).toEqual(
			expect.objectContaining({
				category: "medical_dental_services",
				grossAmount: "1000.00",
				eligibleBase: "800.00",
				insuranceReimbursementAmount: "200.00",
				beneficiary: "self",
				verificationStatus: "evidence_attached",
				calculationStatus: "potential",
				attentionReasons: ["requirement_unknown:issuer_eligible"],
			}),
		);
	});
});
