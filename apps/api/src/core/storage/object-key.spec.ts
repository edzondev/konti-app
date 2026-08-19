import { buildDocumentObjectKey } from "./object-key";

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
