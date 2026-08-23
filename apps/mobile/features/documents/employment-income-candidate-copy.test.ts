import { describe, expect, it } from "vitest";

import { employmentIncomeCandidateCopy } from "./employment-income-candidate-copy";
import type { EmploymentIncomeCandidate } from "./types";

const candidate: EmploymentIncomeCandidate = {
	eligibility: "eligible",
	recordKind: "year_to_date_snapshot",
	coverageStart: "2026-01-01",
	coverageEnd: "2026-06-30",
	coverageScope: "single_payer",
	grossAmount: "30000.00",
	withheldTaxAmount: "1500.00",
	payerName: "ACME SAC",
	payerTaxId: "20123456789",
	verificationScope: "unverified_ocr_evidence",
	warnings: [],
};

describe("employmentIncomeCandidateCopy", () => {
	it("presents OCR as editable evidence rather than SUNAT verification", () => {
		const copy = employmentIncomeCandidateCopy(candidate);

		expect(copy.title).toBe("Acumulado de planilla por revisar");
		expect(copy.description).toContain("Lo leímos de este documento");
		expect(copy.verificationLabel).toBe("Evidencia OCR sin verificar; tú confirmarás los datos.");
		expect(JSON.stringify(copy)).not.toContain("confirmado por SUNAT");
		expect(copy.canReview).toBe(true);
	});

	it("turns missing coverage into an actionable explanation without inferring months", () => {
		const copy = employmentIncomeCandidateCopy({
			...candidate,
			eligibility: "insufficient_fields",
			coverageStart: null,
			coverageEnd: null,
			warnings: ["missing_coverage_start", "missing_coverage_end"],
		});

		expect(copy.missingLabel).toBe(
			"Falta indicar desde qué fecha hasta qué fecha cubre el documento.",
		);
		expect(copy.canReview).toBe(true);
	});

	it("does not describe an unsupported currency as an already decided document", () => {
		const copy = employmentIncomeCandidateCopy({
			...candidate,
			eligibility: "unsupported_currency",
		});

		expect(copy.canReview).toBe(false);
		expect(copy.terminalLabel).toBe(
			"Este documento usa una moneda que Konti todavía no admite para este cálculo.",
		);
		expect(copy.terminalLabel).not.toMatch(/ya fue decidido/i);
	});

	it("explains when processing is not ready instead of enabling confirmation", () => {
		const copy = employmentIncomeCandidateCopy({
			...candidate,
			eligibility: "insufficient_fields",
			warnings: ["document_not_ready"],
		});

		expect(copy.canReview).toBe(false);
		expect(copy.terminalLabel).toBe(
			"Terminaremos de leer el documento antes de habilitar la revisión.",
		);
	});
});
