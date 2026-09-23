import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetchMock } = vi.hoisted(() => ({
	apiFetchMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/core/api-fetch", () => ({
	ApiError: class ApiError extends Error {},
	apiFetch: apiFetchMock,
}));

import { uploadDocument } from "@/features/scan/upload-document";

const jpeg = new File(["x"], "boleta.jpg", { type: "image/jpeg", lastModified: 0 });

function field(form: FormData, name: string): unknown {
	return (form as unknown as { get(fieldName: string): unknown }).get(name);
}

function uploadedForm(): FormData {
	const init = apiFetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
	if (!(init?.body instanceof FormData)) throw new Error("Expected a FormData upload");
	return init.body;
}

describe("uploadDocument", () => {
	beforeEach(() => {
		apiFetchMock.mockClear();
	});

	it.each([undefined, null, "", " \n\t ", "a".repeat(2001)])(
		"omits an invalid QR payload: %s",
		async (qrPayload) => {
			await uploadDocument({
				file: jpeg,
				filename: "boleta.jpg",
				source: "camera",
				qrPayload,
			});

			expect(field(uploadedForm(), "qrPayload")).toBeNull();
		},
	);

	it("uploads the file, source, and trimmed valid QR payload", async () => {
		await uploadDocument({
			file: jpeg,
			filename: "boleta.jpg",
			source: "gallery",
			qrPayload: ` ${"b".repeat(2000)} `,
		});

		expect(apiFetchMock).toHaveBeenCalledWith("/documents", {
			method: "POST",
			body: expect.any(FormData),
		});
		const form = uploadedForm();
		expect(field(form, "source")).toBe("gallery");
		expect(field(form, "qrPayload")).toBe("b".repeat(2000));
		expect(field(form, "file")).toMatchObject({
			name: "boleta.jpg",
			type: "image/jpeg",
		});
	});
});
