import { describe, expect, it } from "vitest";

import {
	dateStringToPickerDate,
	pickerDateToDateString,
	taxIncomeFormDefaults,
	taxIncomeFormPendingState,
} from "./tax-income-form.helpers";

describe("tax income form helpers", () => {
	it("round-trips a payment date without a UTC day shift", () => {
		const pickerDate = dateStringToPickerDate("2026-01-01");
		expect(pickerDateToDateString(pickerDate)).toBe("2026-01-01");
	});

	it("does not infer payment date from the document issue date", () => {
		expect(
			taxIncomeFormDefaults({
				paymentDate: null,
				issueDate: "2026-08-12",
				grossAmount: "2500.00",
				withheldTaxAmount: "200.00",
				payerName: "Cliente SAC",
			}),
		).toEqual({
			receivedAt: "",
			grossAmount: "2500.00",
			withheldTaxAmount: "200.00",
			payerName: "Cliente SAC",
			notes: "",
		});
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
