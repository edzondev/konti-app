import { describe, expect, it } from "vitest";

import { taxIncomeFormDefaults, taxIncomeFormPendingState } from "./tax-income-form.helpers";

describe("tax income form helpers", () => {
	it("does not infer payment date from the document issue date", () => {
		expect(
			taxIncomeFormDefaults({
				paymentDate: null,
				issueDate: "2026-08-12",
				dueDate: "2026-08-20",
				documentReportedPaymentDate: "2026-08-18",
				grossAmount: "2500.00",
				withheldTaxAmount: "200.00",
				payerName: "Cliente SAC",
			}),
		).toEqual({
			activityType: "",
			receivedAt: "",
			grossAmount: "2500.00",
			withheldTaxAmount: "200.00",
			payerName: "Cliente SAC",
			notes: "",
		});
	});

	it("preserves an explicitly classified activity when editing", () => {
		expect(
			taxIncomeFormDefaults({ activityType: "fourth_special", paymentDate: "2026-08-20" }),
		).toMatchObject({ activityType: "fourth_special", receivedAt: "2026-08-20" });
	});

	it("defaults only a new manual income to today in Lima", () => {
		const now = new Date("2026-07-02T04:30:00.000Z");

		expect(taxIncomeFormDefaults({}, { defaultPaymentDate: "today", now })).toMatchObject({
			receivedAt: "2026-07-01",
		});
		expect(
			taxIncomeFormDefaults(
				{ issueDate: "2026-06-30", documentReportedPaymentDate: "2026-07-01" },
				{ now },
			),
		).toMatchObject({ receivedAt: "" });
		expect(
			taxIncomeFormDefaults({ paymentDate: "2026-07-02" }, { defaultPaymentDate: "today", now }),
		).toMatchObject({ receivedAt: "2026-07-02" });
	});

	it("does not present a delete operation as saving", () => {
		expect(
			taxIncomeFormPendingState({
				isCreatePending: false,
				isUpdatePending: false,
				isDocumentDecisionPending: false,
				isDeletePending: true,
			}),
		).toEqual({
			isAnyPending: true,
			isSaving: false,
			isDeleting: true,
		});
	});
});
