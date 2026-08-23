import { normalizeExtraction, validateExtraction } from "./extraction";

const raw = {
	issuerTaxId: "20100070970",
	issuerName: "  Rústica  ",
	issueDate: "12/08/2026",
	documentType: "boleta",
	documentNumber: "B002-14872",
	currency: "S/",
	subtotalAmount: "125.42",
	taxAmount: "22.58",
	totalAmount: "148.00",
	paymentTerms: "cash",
	dueDate: null,
	actualPaymentDate: "20/08/2026",
	grossFeeAmount: "2500.00",
	incomeTaxWithheldAmount: "200.00",
	netPaidAmount: "2300.00",
	payerName: "  Cliente SAC  ",
};

describe("normalizeExtraction", () => {
	it("maps boleta, S/, trims name, lima date, keeps decimal strings", () => {
		const n = normalizeExtraction(raw);
		expect(n.issuerTaxId).toBe("20100070970");
		expect(n.issuerName).toBe("Rústica");
		expect(n.issueDate).toBe("2026-08-12");
		expect(n.documentType).toBe("receipt");
		expect(n.currencyCode).toBe("PEN");
		expect(n.totalAmount).toBe("148.00");
	});

	it("maps $ to USD and empty currency to null", () => {
		expect(normalizeExtraction({ ...raw, currency: "$" }).currencyCode).toBe("USD");
		expect(normalizeExtraction({ ...raw, currency: null }).currencyCode).toBeNull();
	});

	it("does not invent PEN when currency is missing", () => {
		expect(normalizeExtraction({ ...raw, currency: "" }).currencyCode).toBeNull();
	});

	it("maps unknown type to unknown", () => {
		expect(normalizeExtraction({ ...raw, documentType: "xyz" }).documentType).toBe("unknown");
	});

	it("clears invalid RUC", () => {
		expect(normalizeExtraction({ ...raw, issuerTaxId: "20100070971" }).issuerTaxId).toBeNull();
	});

	it("keeps fee-receipt payment semantics separate from generic tax", () => {
		const normalized = normalizeExtraction({
			...raw,
			documentType: "recibo_por_honorarios",
			taxAmount: "450.00",
			incomeTaxWithheldAmount: null,
		});

		expect(normalized).toMatchObject({
			documentType: "fee_receipt",
			issueDate: "2026-08-12",
			paymentTerms: "cash",
			dueDate: null,
			actualPaymentDate: "2026-08-20",
			grossFeeAmount: "2500.00",
			incomeTaxWithheldAmount: null,
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
			taxAmount: "450.00",
		});
	});

	it("does not infer actual payment date from issue date", () => {
		const normalized = normalizeExtraction({ ...raw, actualPaymentDate: null });

		expect(normalized.issueDate).toBe("2026-08-12");
		expect(normalized.actualPaymentDate).toBeNull();
	});

	it("persists only protected consumer identity evidence", () => {
		const normalized = normalizeExtraction({
			...raw,
			consumerDocumentNumber: "12345678",
			consumerDocumentBlindIndex: "a".repeat(64),
			consumerDocumentLast4: "5678",
		});

		expect(normalized).toMatchObject({
			consumerDocumentBlindIndex: "a".repeat(64),
			consumerDocumentLast4: "5678",
		});
		expect(normalized).not.toHaveProperty("consumerDocumentNumber");
		expect(JSON.stringify(normalized)).not.toContain("12345678");
	});

	it("normalizes explicit payroll coverage without inferring it from issueDate", () => {
		const normalized = normalizeExtraction({
			...raw,
			documentType: "boleta_de_pago",
			employmentRecordKind: "period",
			employmentGrossAmount: "5000.00",
			employmentWithheldTaxAmount: "150.00",
			coverageStart: "01/03/2026",
			coverageEnd: "31/03/2026",
			coverageScope: "single_payer",
			employerName: " ACME SAC ",
			employerTaxId: "20123456789",
		});

		expect(normalized).toMatchObject({
			documentType: "payroll_slip",
			employmentRecordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			employerName: "ACME SAC",
			employerTaxId: "20123456789",
		});
		expect(
			normalizeExtraction({ ...raw, documentType: "boleta_de_pago" }).coverageStart,
		).toBeNull();
	});

	it.each([
		["certificado_retenciones", "withholding_certificate"],
		["reporte_sunat", "sunat_document"],
	] as const)("maps %s employment evidence to %s", (documentType, expected) => {
		expect(normalizeExtraction({ ...raw, documentType }).documentType).toBe(expected);
	});

	it("keeps a credit due date separate from actual collection", () => {
		const normalized = normalizeExtraction({
			...raw,
			documentType: "recibo_por_honorarios",
			issueDate: "2024-03-18",
			paymentTerms: "credit",
			dueDate: "2024-04-19",
			actualPaymentDate: null,
		});

		expect(normalized).toMatchObject({
			paymentTerms: "credit",
			dueDate: "2024-04-19",
			actualPaymentDate: null,
		});
	});
});

describe("validateExtraction", () => {
	it("is ready when four critical fields are present", () => {
		const d = validateExtraction(normalizeExtraction(raw));
		expect(d.status).toBe("ready");
		expect(d.doubtfulFields).toEqual([]);
		expect(d.fieldConfidence.issuerTaxId).toBeNull();
	});

	it("needs_review when RUC missing", () => {
		const d = validateExtraction(normalizeExtraction({ ...raw, issuerTaxId: null }));
		expect(d.status).toBe("needs_review");
		expect(d.doubtfulFields).toContain("issuerTaxId");
	});

	it("needs_review when documentType is unknown", () => {
		const d = validateExtraction(normalizeExtraction({ ...raw, documentType: "xyz" }));
		expect(d.status).toBe("needs_review");
		expect(d.doubtfulFields).toContain("documentType");
	});

	it("is ready without documentNumber", () => {
		const d = validateExtraction(normalizeExtraction({ ...raw, documentNumber: null }));
		expect(d.status).toBe("ready");
	});

	it("failed when annotation is empty", () => {
		const empty = {
			issuerTaxId: null,
			issuerName: null,
			issueDate: null,
			documentType: null,
			documentNumber: null,
			currency: null,
			subtotalAmount: null,
			taxAmount: null,
			totalAmount: null,
			paymentTerms: null,
			dueDate: null,
			actualPaymentDate: null,
			grossFeeAmount: null,
			incomeTaxWithheldAmount: null,
			netPaidAmount: null,
			payerName: null,
		};
		expect(validateExtraction(normalizeExtraction(empty)).status).toBe("failed");
	});
});
