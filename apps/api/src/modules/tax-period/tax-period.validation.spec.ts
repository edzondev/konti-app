import {
	createTaxFilingSchema,
	createTaxPaymentSchema,
	createTaxPeriodReviewCommandSchema,
	createTaxSuspensionSchema,
	taxPeriodParamSchema,
	updateTaxPeriodSchema,
} from "./tax-period.validation";

const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const sourceDocumentId = "33333333-3333-4333-8333-333333333333";
const now = new Date("2027-02-01T12:00:00.000Z");

describe("tax period validation", () => {
	it("validates one atomic monthly review command with a root idempotency key", () => {
		const result = createTaxPeriodReviewCommandSchema(
			new Date("2026-08-23T17:00:00.000Z"),
		).safeParse({
			idempotencyKey,
			coverage: "complete",
			activityClassification: "ordinary",
			suspension: {
				answer: "no",
				authorizationDate: null,
				restartState: "not_required",
				restartDate: null,
			},
			filing: { answer: "no", filedAt: null, confirmationNumber: null },
			payment: {
				answer: "yes",
				amountPen: "320.8",
				paidAt: "2026-08-20",
				confirmationCode: null,
			},
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.payment.amountPen).toBe("320.80");
			expect(result.data.filing.verificationScope).toBe("user_provided");
		}
	});
	it("accepts only a monthly period from tax year 2026", () => {
		expect(taxPeriodParamSchema.safeParse("2026-01").success).toBe(true);
		expect(taxPeriodParamSchema.safeParse("2026-12").success).toBe(true);
		expect(taxPeriodParamSchema.safeParse("2025-12").success).toBe(false);
		expect(taxPeriodParamSchema.safeParse("2026-13").success).toBe(false);
	});

	it("keeps unknown activity explicit in a period review", () => {
		expect(
			updateTaxPeriodSchema.safeParse({
				activityClassification: "unknown",
				idempotencyKey,
			}).data,
		).toEqual({ activityClassification: "unknown", idempotencyKey });
	});

	it("rejects official verification supplied by a public client", () => {
		const result = createTaxFilingSchema(now).safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			filedAt: "2027-01-15",
			confirmationNumber: "616-123",
			verificationScope: "system_verified",
			sourceDocumentId,
		});

		expect(result.success).toBe(false);
	});

	it("allows real filing and payment dates after the 2026 tax period", () => {
		const filing = createTaxFilingSchema(now).safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			filedAt: "2027-01-15",
			confirmationNumber: null,
			verificationScope: "user_provided",
			sourceDocumentId: null,
		});
		const payment = createTaxPaymentSchema(now).safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			amountPen: "320.8",
			paidAt: "2027-01-16",
			confirmationCode: null,
			verificationScope: "user_provided",
			sourceDocumentId: null,
		});

		expect(filing.success).toBe(true);
		expect(payment.success && payment.data.amountPen).toBe("320.80");
	});

	it("rejects filing and payment dates that are still in the future in Lima", () => {
		const beforeFactsOccurred = new Date("2026-08-23T17:00:00.000Z");
		const filing = createTaxFilingSchema(beforeFactsOccurred).safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			filedAt: "2027-01-15",
			confirmationNumber: null,
		});
		const payment = createTaxPaymentSchema(beforeFactsOccurred).safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			amountPen: "320.80",
			paidAt: "2027-01-16",
			confirmationCode: null,
		});

		expect(filing.success).toBe(false);
		expect(payment.success).toBe(false);
	});

	it("requires positive payment evidence only for an affirmative payment", () => {
		const invalidYes = createTaxPaymentSchema(now).safeParse({
			period: "2026-01",
			idempotencyKey,
			answer: "yes",
			amountPen: "0.00",
			paidAt: null,
			confirmationCode: null,
		});
		const validNo = createTaxPaymentSchema(now).safeParse({
			period: "2026-01",
			idempotencyKey,
			answer: "no",
			amountPen: null,
			paidAt: null,
			confirmationCode: null,
		});

		expect(invalidYes.success).toBe(false);
		expect(validNo.success).toBe(true);
	});

	it("validates suspension authorization and restart inside 2026", () => {
		const valid = createTaxSuspensionSchema.safeParse({
			period: "2026-02",
			idempotencyKey,
			answer: "yes",
			authorizationDate: "2026-01-10",
			restartState: "required",
			restartDate: "2026-01-11",
		});
		const beforeEffectiveDate = createTaxSuspensionSchema.safeParse({
			period: "2026-02",
			idempotencyKey,
			answer: "yes",
			authorizationDate: "2026-01-10",
			restartState: "required",
			restartDate: "2026-01-10",
		});
		const outsideTaxYear = createTaxSuspensionSchema.safeParse({
			period: "2026-12",
			idempotencyKey,
			answer: "yes",
			authorizationDate: "2027-01-01",
			restartState: "not_required",
			restartDate: null,
		});

		expect(valid.success).toBe(true);
		expect(beforeEffectiveDate.success).toBe(false);
		expect(outsideTaxYear.success).toBe(false);
	});

	it("requires attached-evidence scope when a source document is present", () => {
		const mismatched = createTaxFilingSchema(now).safeParse({
			period: "2026-01",
			idempotencyKey,
			answer: "yes",
			filedAt: "2026-02-10",
			confirmationNumber: null,
			verificationScope: "user_provided",
			sourceDocumentId,
		});

		expect(mismatched.success).toBe(false);
	});

	it("does not accept a combined filing and payment payload", () => {
		const combined = createTaxFilingSchema(now).safeParse({
			period: "2026-01",
			idempotencyKey,
			answer: "yes",
			filedAt: "2026-02-10",
			confirmationNumber: null,
			amountPen: "320.80",
			paidAt: "2026-02-10",
		});

		expect(combined.success).toBe(false);
	});
});
