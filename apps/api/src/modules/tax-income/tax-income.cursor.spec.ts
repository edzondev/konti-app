import { decodeTaxIncomeCursor, encodeTaxIncomeCursor } from "./tax-income.cursor";

describe("tax income cursor", () => {
	it("round-trips the three ordering fields", () => {
		const cursor = {
			receivedAt: "2026-08-21",
			createdAt: "2026-08-21T15:00:00.000Z",
			id: "11111111-1111-4111-8111-111111111111",
		};

		expect(decodeTaxIncomeCursor(encodeTaxIncomeCursor(cursor))).toEqual(cursor);
	});

	it.each([
		"not base64!",
		Buffer.from("{}").toString("base64url"),
		Buffer.from(JSON.stringify({ receivedAt: "2025-01-01", createdAt: "bad", id: "bad" })).toString(
			"base64url",
		),
	])("rejects invalid cursor %s", (cursor) => {
		expect(() => decodeTaxIncomeCursor(cursor)).toThrow("Invalid tax income cursor");
	});
});
