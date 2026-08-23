import { describe, expect, it } from "vitest";

import { fourthIncomeCandidateCopy } from "./fourth-income-candidate-copy";
import type { FourthIncomeCandidate } from "./types";

const candidate: FourthIncomeCandidate = {
	eligibility: "eligible",
	issueDate: "2026-08-12",
	paymentTerms: "credit",
	dueDate: "2026-08-20",
	documentReportedPaymentDate: "2026-08-18",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	netPaidAmount: "2300.00",
	payerName: "Cliente SAC",
	decision: null,
	warnings: [],
};

describe("fourthIncomeCandidateCopy", () => {
	it("keeps issue, due, and document-reported payment dates as separate evidence", () => {
		expect(fourthIncomeCandidateCopy(candidate)).toMatchObject({
			canDecide: true,
			issueDateLabel: "Emitido: 2026-08-12",
			dueDateLabel: "Vence: 2026-08-20",
			documentPaymentEvidenceLabel:
				"El documento indica un pago el 2026-08-18. Confirma la fecha real.",
		});
	});

	it("does not treat a due date as an actual collection date", () => {
		const copy = fourthIncomeCandidateCopy({
			...candidate,
			documentReportedPaymentDate: null,
		});

		expect(copy.canDecide).toBe(true);
		expect(copy.dueDateLabel).toBe("Vence: 2026-08-20");
		expect(copy.documentPaymentEvidenceLabel).toBe("La fecha real de cobro la confirmas tú.");
		expect(copy.description).toContain("cuándo lo cobraste");
	});

	it("offers paid, unpaid, and unsure as beginner-first decisions", () => {
		expect(fourthIncomeCandidateCopy(candidate).decisions).toEqual([
			{ decision: "paid", label: "Sí, ya me pagaron" },
			{ decision: "unpaid", label: "Todavía no me pagan" },
			{ decision: "unsure", label: "No estoy seguro" },
		]);
	});

	it.each([
		["unpaid", "Indicaste que todavía no te pagan"],
		["unsure", "Indicaste que no estás seguro del pago"],
	] as const)(
		"keeps a previous %s decision actionable and visible",
		(decision, priorDecisionLabel) => {
			const copy = fourthIncomeCandidateCopy({ ...candidate, decision });

			expect(copy).toMatchObject({
				canDecide: true,
				priorDecisionLabel,
				selectedDecision: decision,
			});
		},
	);

	it("keeps an unknown activity decision actionable without choosing a tax category", () => {
		expect(fourthIncomeCandidateCopy({ ...candidate, decision: "activity_unsure" })).toMatchObject({
			canDecide: true,
			priorDecisionLabel: "Falta confirmar qué tipo de actividad realizaste",
			selectedDecision: "paid",
		});
	});

	it("explains the payment terms independently from collection", () => {
		expect(fourthIncomeCandidateCopy(candidate).paymentTermsLabel).toBe(
			"Forma de pago del recibo: crédito",
		);
	});

	it("does not offer a decision for unsupported currency or a decided receipt", () => {
		expect(
			fourthIncomeCandidateCopy({ ...candidate, eligibility: "unsupported_currency" }).canDecide,
		).toBe(false);
		expect(
			fourthIncomeCandidateCopy({ ...candidate, eligibility: "already_decided" }).canDecide,
		).toBe(false);
	});

	it.each(["paid", "not_mine"] as const)("treats only %s as terminal", (decision) => {
		expect(
			fourthIncomeCandidateCopy({
				...candidate,
				decision,
				eligibility: "already_decided",
			}).canDecide,
		).toBe(false);
	});
});
