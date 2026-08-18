import { updateTaxProfileSchema } from "./tax-profile.validation";

describe("updateTaxProfileSchema", () => {
	it("accepts incomeMode and trackDeductibles", () => {
		const result = updateTaxProfileSchema.safeParse({
			incomeMode: "mixed",
			trackDeductibles: true,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				incomeMode: "mixed",
				trackDeductibles: true,
			});
		}
	});

	it("rejects a body without trackDeductibles", () => {
		const result = updateTaxProfileSchema.safeParse({
			incomeMode: "employment",
		});

		expect(result.success).toBe(false);
	});

	it("rejects unknown incomeMode", () => {
		const result = updateTaxProfileSchema.safeParse({
			incomeMode: "business",
			trackDeductibles: false,
		});

		expect(result.success).toBe(false);
	});
});
