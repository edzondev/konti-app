import { describe, expect, it } from "vitest";

import { resolveDateOnlyViewport } from "@/shared/date-only";

import {
	createEmploymentIncomeFormSchema,
	employmentIncomeFormDefaults,
} from "./employment-form.validation";

const validPeriod = {
	recordKind: "period",
	coverageStart: "2026-03-01",
	coverageEnd: "2026-03-31",
	coverageScope: "single_payer",
	grossAmount: "5000.5",
	withheldTaxAmount: "150",
	payerName: "  ACME SAC  ",
	payerTaxId: "20123456789",
	notes: "",
};

describe("createEmploymentIncomeFormSchema", () => {
	const schema = createEmploymentIncomeFormSchema(new Date("2026-08-23T17:00:00.000Z"));

	it("normalizes a monthly payroll record without asking for the user's RUC", () => {
		expect(schema.parse(validPeriod)).toEqual({
			recordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			grossAmount: "5000.50",
			withheldTaxAmount: "150.00",
			payerName: "ACME SAC",
			payerTaxId: "20123456789",
			notes: null,
		});
	});

	it("treats an empty optional withholding as zero before building the request", () => {
		expect(
			schema.parse({
				...validPeriod,
				grossAmount: "650",
				withheldTaxAmount: "",
				payerTaxId: "",
				notes: "",
			}),
		).toEqual({
			recordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			grossAmount: "650.00",
			withheldTaxAmount: "0.00",
			payerName: "ACME SAC",
			payerTaxId: null,
			notes: null,
		});
	});

	it("preserves an explicit zero withholding and reports malformed money without throwing", () => {
		expect(schema.parse({ ...validPeriod, withheldTaxAmount: "0" })).toMatchObject({
			withheldTaxAmount: "0.00",
		});

		expect(schema.safeParse({ ...validPeriod, grossAmount: "" })).toMatchObject({ success: false });
		expect(schema.safeParse({ ...validPeriod, withheldTaxAmount: "not-money" })).toMatchObject({
			success: false,
		});
	});

	it("accepts an all-employer accumulated snapshot without inventing an employer", () => {
		const result = schema.parse({
			...validPeriod,
			recordKind: "year_to_date_snapshot",
			coverageStart: "2026-01-01",
			coverageEnd: "2026-06-30",
			coverageScope: "all_employers",
			payerName: "",
			payerTaxId: "",
		});

		expect(result).toMatchObject({
			coverageScope: "all_employers",
			payerName: null,
			payerTaxId: null,
		});
	});

	it("accepts a single payer identified by exact RUC even when the name is missing", () => {
		expect(
			schema.parse({
				...validPeriod,
				payerName: "",
			}),
		).toMatchObject({ payerName: null, payerTaxId: "20123456789" });
	});

	it("keeps new coverage blank while opening its calendar in the current month", () => {
		const defaults = employmentIncomeFormDefaults();

		expect(defaults).toMatchObject({ coverageStart: "", coverageEnd: "" });
		expect(
			resolveDateOnlyViewport({
				value: defaults.coverageStart,
				emptyViewportDate: "2026-07-02",
				minimumDate: "2026-01-01",
				maximumDate: "2026-08-23",
			}),
		).toBe("2026-07-02");
	});

	it("preserves coverage dates supplied by an edit or OCR candidate", () => {
		expect(
			employmentIncomeFormDefaults({
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
			}),
		).toMatchObject({ coverageStart: "2026-03-01", coverageEnd: "2026-03-31" });
	});

	it.each([
		["outside year", { coverageStart: "2025-12-01" }, "coverageStart"],
		["reversed range", { coverageStart: "2026-04-01", coverageEnd: "2026-03-31" }, "coverageEnd"],
		["period crosses month", { coverageEnd: "2026-04-30" }, "coverageEnd"],
		[
			"monthly record cannot cover all employers",
			{ coverageScope: "all_employers", payerName: "", payerTaxId: "" },
			"coverageScope",
		],
		["future date in Lima", { coverageEnd: "2026-08-24" }, "coverageEnd"],
		["unknown scope", { coverageScope: "" }, "coverageScope"],
		["missing single employer", { payerName: "", payerTaxId: "" }, "payerName"],
		["malformed employer RUC", { payerTaxId: "1234" }, "payerTaxId"],
		[
			"withholding over gross",
			{ grossAmount: "100.00", withheldTaxAmount: "100.01" },
			"withheldTaxAmount",
		],
	] as const)("rejects %s on the actionable field", (_label, override, field) => {
		const result = schema.safeParse({ ...validPeriod, ...override });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual(expect.objectContaining({ path: [field] }));
		}
	});
});
