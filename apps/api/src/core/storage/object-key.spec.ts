import { buildDocumentObjectKey, buildExtractionRawObjectKey } from "./object-key";

describe("buildDocumentObjectKey", () => {
	it("builds the JPEG document object path", () => {
		expect(
			buildDocumentObjectKey({
				userId: "user-123",
				taxYear: 2025,
				documentId: "document-456",
				mimeType: "image/jpeg",
			}),
		).toBe("users/user-123/tax/2025/documents/document-456/original.jpg");
	});

	it("builds the PNG document object path", () => {
		expect(
			buildDocumentObjectKey({
				userId: "user-123",
				taxYear: 2025,
				documentId: "document-456",
				mimeType: "image/png",
			}),
		).toBe("users/user-123/tax/2025/documents/document-456/original.png");
	});
});

describe("buildExtractionRawObjectKey", () => {
	it("builds the extraction raw JSON object path", () => {
		expect(
			buildExtractionRawObjectKey({
				userId: "user-1",
				taxYear: 2026,
				documentId: "doc-1",
				attemptNumber: 2,
			}),
		).toBe("users/user-1/tax/2026/documents/doc-1/extraction-v1-2.json");
	});
});
