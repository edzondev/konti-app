import { describe, expect, it } from "vitest";

import {
	categoryCopy,
	deductionCalculationCopy,
	deductionCapCopy,
	deductionVerificationCopy,
	requirementQuestionsForCategory,
} from "./tax-deduction-copy";

describe("tax deduction copy", () => {
	it("explains verification and calculation as independent dimensions", () => {
		expect(deductionVerificationCopy("evidence_attached")).toContain("evidencia que adjuntaste");
		expect(deductionCalculationCopy("included")).toContain("esta estimación");
		expect(deductionCalculationCopy("potential")).toContain("falta revisar");
		expect(
			`${deductionVerificationCopy("evidence_attached")} ${deductionCalculationCopy("included")}`,
		).not.toMatch(/validado por SUNAT|verificado por SUNAT/i);
	});

	it("explains that the 3 UIT cap is shared and exposes the server-provided discarded amount", () => {
		const copy = deductionCapCopy({
			capPen: "16500.00",
			amountDiscardedByCapPen: "350.00",
		});

		expect(copy).toContain("entre todas las categorías");
		expect(copy).toContain("S/ 350.00");
	});

	it("states that EsSalud applies to the contribution, never the worker salary", () => {
		expect(categoryCopy.household_worker_essalud.rateExplanation).toContain("aporte a EsSalud");
		expect(categoryCopy.household_worker_essalud.rateExplanation).not.toContain("sueldo");
	});

	it("asks medical beneficiary and insurance reimbursement as separate beginner questions", () => {
		const questions = requirementQuestionsForCategory("medical_dental_services");

		expect(questions.map((question) => question.id)).toContain("medicalBeneficiary");
		expect(questions.map((question) => question.id)).toContain("insuranceReimbursementAmountPen");
	});

	it("offers an explicit unknown answer for rent use, attribution and EsSalud registration", () => {
		for (const category of ["rent", "household_worker_essalud"] as const) {
			const questions = requirementQuestionsForCategory(category);
			expect(questions.every((question) => question.allowsUnknown)).toBe(true);
		}
	});
});
