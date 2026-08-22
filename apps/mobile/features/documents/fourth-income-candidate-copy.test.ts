import { describe, expect, it } from "vitest";

import { fourthIncomeCandidateCopy } from "./fourth-income-candidate-copy";
import type { FourthIncomeCandidate } from "./types";

const candidate: FourthIncomeCandidate = {
	eligibility: "eligible",
	issueDate: "2026-08-12",
	paymentDate: "2026-08-20",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	netPaidAmount: "2300.00",
	payerName: "Cliente SAC",
	warnings: [],
};

describe("fourthIncomeCandidateCopy", () => {
	it("keeps issue and payment dates as separate concepts", () => {
		expect(fourthIncomeCandidateCopy(candidate)).toMatchObject({
			canDecide: true,
			issueDateLabel: "Emitido: 2026-08-12",
			paymentDateLabel: "Cobrado: 2026-08-20",
		});
	});

	it("asks for payment date instead of copying the issue date", () => {
		const copy = fourthIncomeCandidateCopy({
			...candidate,
			eligibility: "insufficient_fields",
			paymentDate: null,
			warnings: ["missing_payment_date"],
		});

		expect(copy.canDecide).toBe(true);
		expect(copy.paymentDateLabel).toBe("Fecha de cobro: por completar");
		expect(copy.description).toContain("completar la fecha de cobro");
	});

	it("does not offer a decision for unsupported currency or a decided receipt", () => {
		expect(
			fourthIncomeCandidateCopy({ ...candidate, eligibility: "unsupported_currency" }).canDecide,
		).toBe(false);
		expect(
			fourthIncomeCandidateCopy({ ...candidate, eligibility: "already_decided" }).canDecide,
		).toBe(false);
	});
});
