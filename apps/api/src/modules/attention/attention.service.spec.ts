import { AttentionService, selectPrimaryAttention } from "./attention.service";
import type { AttentionRepositoryPort, OpenAttentionRow } from "./attention.types";

function row(overrides: Partial<OpenAttentionRow> = {}): OpenAttentionRow {
	return {
		id: "attention-1",
		itemType: "confirm_fourth_income",
		priority: "normal",
		title: "Confirma si este RHE ya fue cobrado",
		message: "Registra la fecha real cuando recibas el pago.",
		actionType: "confirm_fourth_income",
		actionPayload: { documentId: "document-1" },
		documentId: "document-1",
		resolution: { decision: "unpaid" },
		createdAt: new Date("2026-08-20T12:00:00.000Z"),
		...overrides,
	};
}

describe("selectPrimaryAttention", () => {
	it("orders by priority, then age, then id without mutating the input", () => {
		const input = [
			row({ id: "normal", itemType: "review_tax_deduction", priority: "normal" }),
			row({ id: "new-high", priority: "high", createdAt: new Date("2026-08-22") }),
			row({ id: "old-high", priority: "high", createdAt: new Date("2026-08-21") }),
		];

		expect(selectPrimaryAttention(input)).toMatchObject({ id: "old-high" });
		expect(input.map(({ id }) => id)).toEqual(["normal", "new-high", "old-high"]);
	});

	it("returns null when no persisted item has an actionable payload", () => {
		expect(
			selectPrimaryAttention([
				row({ actionPayload: {}, documentId: null }),
				row({ id: "unsupported", itemType: "passive_notice" }),
			]),
		).toBeNull();
	});
});

describe("AttentionService", () => {
	const repository: jest.Mocked<AttentionRepositoryPort> = {
		readOpenOwned: jest.fn(),
	};
	const service = new AttentionService(repository);

	beforeEach(() => {
		jest.clearAllMocks();
		repository.readOpenOwned.mockResolvedValue({
			rows: [],
			totalCount: 0,
		});
	});

	it("maps each persisted vertical to the exact mobile action contract", async () => {
		repository.readOpenOwned.mockResolvedValue({
			rows: [
				row(),
				row({
					id: "activity",
					actionPayload: { documentId: "document-activity" },
					documentId: "document-activity",
					resolution: { decision: "activity_unsure" },
				}),
				row({
					id: "employment",
					itemType: "resolve_employment_coverage",
					actionType: "resolve_employment_coverage",
					actionPayload: { recordId: "income-1" },
				}),
				row({
					id: "deduction",
					itemType: "review_tax_deduction",
					actionType: "review_tax_deduction",
					actionPayload: { recordId: "deduction-1" },
				}),
				row({
					id: "monthly",
					itemType: "review_monthly_fourth",
					actionType: "review_monthly_fourth",
					actionPayload: { period: "2026-08" },
				}),
			],
			totalCount: 5,
		});

		const result = await service.getOpenForUser("user-1", 2026, 20);

		expect(result.items.map(({ itemType, action }) => ({ itemType, action }))).toEqual(
			expect.arrayContaining([
				{
					itemType: "classify_fourth_activity",
					action: {
						kind: "classify_fourth_activity",
						documentId: "document-activity",
					},
				},
				{
					itemType: "confirm_rhe_payment",
					action: { kind: "review_rhe_payment", documentId: "document-1" },
				},
				{
					itemType: "resolve_employment_coverage",
					action: { kind: "resolve_employment_coverage", recordId: "income-1" },
				},
				{
					itemType: "verify_deduction",
					action: { kind: "verify_deduction", deductionId: "deduction-1" },
				},
				{
					itemType: "review_monthly_fourth",
					action: { kind: "review_monthly_fourth", period: "2026-08" },
				},
			]),
		);
		expect(result).toMatchObject({ count: 5 });
		expect(repository.readOpenOwned).toHaveBeenCalledWith("user-1", 2026, 20);
	});

	it("returns an honest empty projection", async () => {
		await expect(service.getOpenForUser("user-1", 2026, 20)).resolves.toEqual({
			count: 0,
			items: [],
			nextItem: null,
		});
	});

	it("does not turn repository failures into an empty state", async () => {
		repository.readOpenOwned.mockRejectedValue(new Error("database unavailable"));

		await expect(service.getOpenForUser("user-1", 2026, 20)).rejects.toThrow(
			"database unavailable",
		);
	});
});
