import {
	createDocumentDecisionSchema,
	createEmploymentCoverageResolutionSchema,
	createTaxIncomeSchema,
	updateTaxIncomeSchema,
} from "./tax-income.validation";

const now = new Date("2026-08-21T18:00:00.000Z");

describe("tax income validation", () => {
	const employmentInput = {
		incomeType: "employment" as const,
		recordKind: "period" as const,
		coverageStart: "2026-01-01",
		coverageEnd: "2026-01-31",
		coverageScope: "single_payer" as const,
		grossAmount: "5000",
		withheldTaxAmount: "150.5",
		payerName: "  ACME SAC  ",
		payerTaxId: "20123456789",
		notes: null,
		idempotencyKey: "22222222-2222-4222-8222-222222222222",
	};

	it("normalizes a valid manual income without accepting server-owned fields", () => {
		const result = createTaxIncomeSchema(now).parse({
			activityType: "fourth_ordinary",
			receivedAt: "2026-08-21",
			grossAmount: "2500",
			withheldTaxAmount: "200.5",
			payerName: "  Cliente SAC  ",
			notes: "  Pago de agosto  ",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
		});

		expect(result).toEqual({
			activityType: "fourth_ordinary",
			receivedAt: "2026-08-21",
			grossAmount: "2500.00",
			withheldTaxAmount: "200.50",
			payerName: "Cliente SAC",
			notes: "Pago de agosto",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
		});
		expect(
			createTaxIncomeSchema(now).safeParse({
				...result,
				taxProfileId: "11111111-1111-4111-8111-111111111111",
			}),
		).toMatchObject({ success: false });
	});

	it.each(["fourth_ordinary", "fourth_special"] as const)(
		"accepts %s for a manual fourth income",
		(activityType) => {
			expect(
				createTaxIncomeSchema(now).safeParse({
					activityType,
					receivedAt: "2026-08-20",
					grossAmount: "1000.00",
					withheldTaxAmount: "80.00",
					payerName: null,
					notes: null,
					idempotencyKey: "22222222-2222-4222-8222-222222222222",
				}),
			).toMatchObject({ success: true });
		},
	);

	it("rejects employment through the fourth-only form", () => {
		expect(
			createTaxIncomeSchema(now).safeParse({
				activityType: "employment",
				receivedAt: "2026-08-20",
				grossAmount: "1000.00",
				withheldTaxAmount: "80.00",
				payerName: null,
				notes: null,
				idempotencyKey: "22222222-2222-4222-8222-222222222222",
			}),
		).toMatchObject({ success: false });
	});

	it("normalizes a strict employment period without inventing receivedAt", () => {
		expect(createTaxIncomeSchema(now).parse(employmentInput)).toEqual({
			...employmentInput,
			grossAmount: "5000.00",
			withheldTaxAmount: "150.50",
			payerName: "ACME SAC",
		});
		expect(
			createTaxIncomeSchema(now).safeParse({ ...employmentInput, receivedAt: "2026-01-31" }),
		).toMatchObject({ success: false });
	});

	it("accepts the canonical manual employment request with zero withholding", () => {
		expect(
			createTaxIncomeSchema(now).parse({
				...employmentInput,
				grossAmount: "650.00",
				withheldTaxAmount: "0.00",
				payerTaxId: null,
				notes: null,
			}),
		).toMatchObject({
			grossAmount: "650.00",
			withheldTaxAmount: "0.00",
			payerTaxId: null,
			notes: null,
		});
	});

	it.each([
		["range outside 2026", { coverageStart: "2025-12-01" }],
		["inverted range", { coverageStart: "2026-02-01", coverageEnd: "2026-01-31" }],
		["missing payer", { payerName: null, payerTaxId: null }],
		["fourth activity", { activityType: "fourth_ordinary" }],
		["all employers period", { coverageScope: "all_employers" }],
	] as const)("rejects employment with %s", (_label, override) => {
		expect(createTaxIncomeSchema(now).safeParse({ ...employmentInput, ...override })).toMatchObject(
			{
				success: false,
			},
		);
	});

	it("accepts a confirmed all-employer accumulated snapshot without a payer", () => {
		expect(
			createTaxIncomeSchema(now).parse({
				...employmentInput,
				recordKind: "year_to_date_snapshot",
				coverageEnd: "2026-06-30",
				coverageScope: "all_employers",
				payerName: null,
				payerTaxId: null,
			}),
		).toMatchObject({
			incomeType: "employment",
			recordKind: "year_to_date_snapshot",
			coverageScope: "all_employers",
		});
	});

	it("accepts only explicit manual employment coverage resolutions", () => {
		expect(
			createEmploymentCoverageResolutionSchema().parse({ decision: "include_separately" }),
		).toEqual({
			decision: "include_separately",
		});
		expect(
			createEmploymentCoverageResolutionSchema().parse({ decision: "exclude_as_covered" }),
		).toEqual({
			decision: "exclude_as_covered",
		});
		expect(
			createEmploymentCoverageResolutionSchema().safeParse({ decision: "included" }),
		).toMatchObject({
			success: false,
		});
	});

	it("accepts an explicit employment document confirmation with no SUNAT verification claim", () => {
		expect(
			createDocumentDecisionSchema(now).parse({
				documentId: "33333333-3333-4333-8333-333333333333",
				decision: "employment_confirmed",
				incomeType: "employment",
				recordKind: "period",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-01-31",
				coverageScope: "single_payer",
				grossAmount: "5000",
				withheldTaxAmount: "150",
				payerName: "ACME SAC",
				payerTaxId: "20123456789",
				notes: null,
			}),
		).toMatchObject({
			decision: "employment_confirmed",
			grossAmount: "5000.00",
			withheldTaxAmount: "150.00",
		});
	});

	it.each(["2025-12-31", "2026-02-30", "2026-08-22", "not-a-date"])(
		"rejects received date %s",
		(receivedAt) => {
			expect(
				createTaxIncomeSchema(now).safeParse({
					activityType: "fourth_ordinary",
					receivedAt,
					grossAmount: "100.00",
					withheldTaxAmount: "0.00",
					idempotencyKey: "22222222-2222-4222-8222-222222222222",
				}),
			).toMatchObject({ success: false });
		},
	);

	it.each(["0", "-1.00", "1.001", "1000000000000.00", "one"])(
		"rejects gross amount %s",
		(grossAmount) => {
			expect(
				createTaxIncomeSchema(now).safeParse({
					activityType: "fourth_ordinary",
					receivedAt: "2026-08-21",
					grossAmount,
					withheldTaxAmount: "0.00",
					idempotencyKey: "22222222-2222-4222-8222-222222222222",
				}),
			).toMatchObject({ success: false });
		},
	);

	it("rejects a withholding greater than gross income", () => {
		expect(
			createTaxIncomeSchema(now).safeParse({
				activityType: "fourth_ordinary",
				receivedAt: "2026-08-21",
				grossAmount: "100.00",
				withheldTaxAmount: "100.01",
				idempotencyKey: "22222222-2222-4222-8222-222222222222",
			}),
		).toMatchObject({ success: false });
	});

	it("requires at least one editable field and rejects idempotency on update", () => {
		expect(updateTaxIncomeSchema(now).safeParse({})).toMatchObject({ success: false });
		expect(
			updateTaxIncomeSchema(now).safeParse({
				grossAmount: "500.00",
				idempotencyKey: "22222222-2222-4222-8222-222222222222",
			}),
		).toMatchObject({ success: false });
		expect(updateTaxIncomeSchema(now).parse({ grossAmount: "500" })).toEqual({
			grossAmount: "500.00",
		});
		expect(updateTaxIncomeSchema(now).parse({ activityType: "fourth_special" })).toEqual({
			activityType: "fourth_special",
		});
	});

	it("accepts a strict not-mine document decision without monetary fields", () => {
		expect(
			createDocumentDecisionSchema(now).parse({
				documentId: "33333333-3333-4333-8333-333333333333",
				decision: "not_mine",
			}),
		).toEqual({
			documentId: "33333333-3333-4333-8333-333333333333",
			decision: "not_mine",
		});
		expect(
			createDocumentDecisionSchema(now).safeParse({
				documentId: "33333333-3333-4333-8333-333333333333",
				decision: "not_mine",
				grossAmount: "100.00",
			}),
		).toMatchObject({ success: false });
	});

	it("requires actual collection data for a paid RHE decision", () => {
		expect(
			createDocumentDecisionSchema(now).parse({
				documentId: "33333333-3333-4333-8333-333333333333",
				decision: "paid",
				activityType: "fourth_special",
				receivedAt: "2026-08-20",
				grossAmount: "6720.00",
				withheldTaxAmount: "0.00",
				payerName: "Cliente SAC",
				notes: null,
			}),
		).toEqual({
			documentId: "33333333-3333-4333-8333-333333333333",
			decision: "paid",
			activityType: "fourth_special",
			receivedAt: "2026-08-20",
			grossAmount: "6720.00",
			withheldTaxAmount: "0.00",
			payerName: "Cliente SAC",
			notes: null,
		});
	});

	it.each(["unpaid", "unsure", "activity_unsure"] as const)(
		"accepts a strict %s decision and rejects collection payloads",
		(decision) => {
			const documentId = "33333333-3333-4333-8333-333333333333";
			expect(createDocumentDecisionSchema(now).parse({ documentId, decision })).toEqual({
				documentId,
				decision,
			});
			expect(
				createDocumentDecisionSchema(now).safeParse({
					documentId,
					decision,
					receivedAt: "2026-08-20",
				}),
			).toMatchObject({ success: false });
		},
	);

	it("rejects the former ambiguous confirmed decision", () => {
		expect(
			createDocumentDecisionSchema(now).safeParse({
				documentId: "33333333-3333-4333-8333-333333333333",
				decision: "confirmed",
				activityType: "fourth_ordinary",
				receivedAt: "2026-08-20",
				grossAmount: "6720.00",
				withheldTaxAmount: "0.00",
			}),
		).toMatchObject({ success: false });
	});
});
