import { describe, expect, it } from "vitest";

import { createTaxIncomeFormSchema } from "./tax-income.validation";

const validInput = {
	activityType: "fourth_ordinary",
	receivedAt: "2026-08-20",
	grossAmount: "2500.5",
	withheldTaxAmount: "200",
	payerName: "  Cliente SAC  ",
	notes: "",
};

describe("createTaxIncomeFormSchema", () => {
	const schema = createTaxIncomeFormSchema(new Date("2026-08-21T15:00:00.000Z"));

	it("normalizes money and optional text", () => {
		expect(schema.parse(validInput)).toEqual({
			activityType: "fourth_ordinary",
			receivedAt: "2026-08-20",
			grossAmount: "2500.50",
			withheldTaxAmount: "200.00",
			payerName: "Cliente SAC",
			notes: null,
		});
	});

	it.each(["fourth_ordinary", "fourth_special"] as const)(
		"accepts the confirmed fourth-category activity %s",
		(activityType) => {
			expect(schema.safeParse({ ...validInput, activityType }).success).toBe(true);
		},
	);

	it("requires the user to classify the activity before saving", () => {
		const result = schema.safeParse({ ...validInput, activityType: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({ path: ["activityType"] }),
			);
		}
	});

	it("does not turn an unsure activity into the favorable ordinary category", () => {
		const result = schema.safeParse({ ...validInput, activityType: "unsure" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({
					path: ["activityType"],
					message: "Puedes dejarlo pendiente, pero no lo incluiremos sin confirmar la actividad.",
				}),
			);
		}
	});

	it("requires a real 2026 payment date that is not in the future in Lima", () => {
		for (const receivedAt of ["2025-12-31", "2026-02-30", "2026-08-22"]) {
			expect(schema.safeParse({ ...validInput, receivedAt }).success).toBe(false);
		}
	});

	it("associates withholding above gross with the withholding field", () => {
		const result = schema.safeParse({
			...validInput,
			grossAmount: "100.00",
			withheldTaxAmount: "100.01",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(
				expect.objectContaining({ path: ["withheldTaxAmount"] }),
			);
		}
	});
});
