import { describe, expect, it } from "vitest";
import { buildDocumentObjectKey } from "./object-keys.js";

describe("buildDocumentObjectKey", () => {
	it("usa el prefijo users/{userId}/documents y la extensión correcta", () => {
		const key = buildDocumentObjectKey("user-1", "image/jpeg");

		expect(key).toMatch(/^users\/user-1\/documents\/[0-9a-f-]+\.jpg$/);
	});

	it("mapea mime types a extensiones", () => {
		expect(buildDocumentObjectKey("u", "image/png")).toMatch(/\.png$/);
		expect(buildDocumentObjectKey("u", "image/webp")).toMatch(/\.webp$/);
		expect(buildDocumentObjectKey("u", "application/pdf")).toMatch(/\.pdf$/);
	});
});
