import { describe, expect, it } from "vitest";
import { previewQrText } from "@/features/scan/qr-preview";

describe("previewQrText", () => {
	it("muestra el dominio de un enlace", () => {
		expect(previewQrText("https://www.drive.google.com/file/d/abc")).toBe("drive.google.com");
	});

	it("muestra el string SUNAT tal cual", () => {
		const raw = "20554612289|03|B001|41608|97.32|638.00|2026-06-30";
		expect(previewQrText(raw)).toBe(raw);
	});
});
