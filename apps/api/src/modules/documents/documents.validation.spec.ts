import { createUploadSchema } from "./documents.validation";

const valid = {
	source: "camera",
	originalFileName: "doc.jpg",
	mimeType: "image/jpeg",
	sizeBytes: 1849210,
	sha256: "a".repeat(64),
	pageCount: 1,
	idempotencyKey: "11111111-1111-4111-8111-111111111111",
};

describe("createUploadSchema", () => {
	it("accepts a jpeg camera upload", () => {
		const result = createUploadSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it("rejects pdf mime", () => {
		expect(createUploadSchema.safeParse({ ...valid, mimeType: "application/pdf" }).success).toBe(
			false,
		);
	});

	it("rejects files larger than 15MB", () => {
		expect(
			createUploadSchema.safeParse({ ...valid, sizeBytes: 15 * 1024 * 1024 + 1 }).success,
		).toBe(false);
	});

	it("rejects sha256 that is not 64 lowercase hex", () => {
		expect(createUploadSchema.safeParse({ ...valid, sha256: "A".repeat(64) }).success).toBe(false);
		expect(createUploadSchema.safeParse({ ...valid, sha256: "ab" }).success).toBe(false);
	});

	it("rejects pageCount other than 1", () => {
		expect(createUploadSchema.safeParse({ ...valid, pageCount: 2 }).success).toBe(false);
	});

	it("rejects source file", () => {
		expect(createUploadSchema.safeParse({ ...valid, source: "file" }).success).toBe(false);
	});
});
