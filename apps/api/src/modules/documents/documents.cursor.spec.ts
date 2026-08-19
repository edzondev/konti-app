import { decodeDocumentCursor, encodeDocumentCursor } from "./documents.cursor";

describe("document cursor", () => {
	it("round-trips a document position", () => {
		const position = { createdAt: "2026-08-19T12:00:00.000Z", id: "document-1" };

		expect(decodeDocumentCursor(encodeDocumentCursor(position))).toEqual(position);
	});

	it('rejects an invalid cursor', () => {
		expect(() => decodeDocumentCursor("nope")).toThrow();
	});

	it("rejects a valid payload with a non-base64url prefix", () => {
		const cursor = encodeDocumentCursor({
			createdAt: "2026-08-19T12:00:00.000Z",
			id: "document-1",
		});

		expect(() => decodeDocumentCursor(`!${cursor}`)).toThrow("Invalid document cursor");
	});
});
