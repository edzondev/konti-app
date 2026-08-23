import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/core/api-client";
import { createEmploymentIncomeFormSchema } from "./employment-form.validation";
import { createTaxIncome, resolveEmploymentCoverage } from "./tax-income.api";

vi.mock("@/core/api-client", () => ({ apiClient: vi.fn() }));

describe("resolveEmploymentCoverage", () => {
	beforeEach(() => vi.mocked(apiClient).mockReset());

	it("posts the explicit user decision to the owned income route", async () => {
		vi.mocked(apiClient).mockResolvedValueOnce({ record: { id: "income-1" } });

		await resolveEmploymentCoverage("income-1", { decision: "exclude_as_covered" });

		expect(apiClient).toHaveBeenCalledWith("/v1/tax-income-records/income-1/coverage-resolution", {
			method: "POST",
			body: { decision: "exclude_as_covered" },
		});
	});
});

describe("createTaxIncome", () => {
	beforeEach(() => vi.mocked(apiClient).mockReset());

	it("sends canonical money and nullable optional fields from the manual employment form", async () => {
		vi.mocked(apiClient).mockResolvedValueOnce({ record: { id: "income-1" } });
		const values = createEmploymentIncomeFormSchema(new Date("2026-08-23T17:00:00.000Z")).parse({
			recordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			grossAmount: "650",
			withheldTaxAmount: "",
			payerName: "ACME SAC",
			payerTaxId: "",
			notes: "",
		});

		await createTaxIncome({
			...values,
			incomeType: "employment",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
		});

		expect(apiClient).toHaveBeenCalledWith("/v1/tax-income-records", {
			method: "POST",
			body: {
				...values,
				incomeType: "employment",
				idempotencyKey: "22222222-2222-4222-8222-222222222222",
			},
		});
		expect(values).toMatchObject({
			grossAmount: "650.00",
			withheldTaxAmount: "0.00",
			payerTaxId: null,
			notes: null,
		});
	});
});
