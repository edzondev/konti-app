import { describe, expect, it } from "vitest";

import {
	taxDeductionCandidateRoute,
	taxDeductionIdentityEvidenceCopy,
} from "./tax-deduction-candidate";
import type { TaxDeductionCandidate } from "./types";

const candidate: TaxDeductionCandidate = {
	categoryHint: "restaurants_hotels",
	issueDate: "2026-08-20",
	grossAmount: "100.00",
	insuranceReimbursementAmount: null,
	serviceDescription: "Consumo",
	paymentMethodEvidence: null,
	propertyCountry: null,
	propertyUse: null,
	supportingFormNumber: null,
	workerRegistrationEvidence: null,
	attributionHint: null,
	verificationStatus: "evidence_attached",
	calculationStatus: "potential",
	consumerIdentityEvidence: "matches",
	warnings: ["Konti no verificó este comprobante contra SUNAT."],
};

describe("tax deduction OCR candidate", () => {
	it("prefills evidence and amount but never turns issueDate into paidAt", () => {
		const route = taxDeductionCandidateRoute("document-1", candidate);

		expect(route).toContain("sourceDocumentId=document-1");
		expect(route).toContain("grossAmountPen=100.00");
		expect(route).not.toContain("paidAt");
		expect(route).not.toContain("issueDate");
	});

	it("describes protected identity comparison without claiming SUNAT verification", () => {
		expect(taxDeductionIdentityEvidenceCopy("matches")).toContain("coincide");
		expect(taxDeductionIdentityEvidenceCopy("matches")).not.toContain("SUNAT verificó");
	});
});
