import {
	createDocumentDecisionSchema,
	createTaxIncomeSchema,
	updateTaxIncomeSchema,
} from "./tax-income.validation";

const now = new Date("2026-08-21T18:00:00.000Z");

describe("tax income validation", () => {
	it("normalizes a valid manual income without accepting server-owned fields", () => {
		const result = createTaxIncomeSchema(now).parse({
			receivedAt: "2026-08-21",
			grossAmount: "2500",
			withheldTaxAmount: "200.5",
			payerName: "  Cliente SAC  ",
			notes: "  Pago de agosto  ",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
		});

		expect(result).toEqual({
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

	it.each(["2025-12-31", "2026-02-30", "2026-08-22", "not-a-date"])(
		"rejects received date %s",
		(receivedAt) => {
			expect(
				createTaxIncomeSchema(now).safeParse({
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
});
