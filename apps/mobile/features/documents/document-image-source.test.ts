import { describe, expect, it } from "vitest";

import { remoteDocumentImageSource } from "./document-image-source";

describe("remoteDocumentImageSource", () => {
	it("uses the document identity as cache key instead of an expiring signed URL", () => {
		expect(
			remoteDocumentImageSource(
				"https://r2.example/document.jpg?signature=temporary",
				"document-1",
				"low",
			),
		).toEqual({
			url: "https://r2.example/document.jpg?signature=temporary",
			options: {
				priority: "low",
				cacheKey: "document:document-1",
				scaleDownLargeImages: true,
			},
		});
	});
});
