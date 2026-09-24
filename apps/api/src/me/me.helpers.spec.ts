import { describe, expect, it } from "vitest";
import { maskIp, parseUserAgent } from "./me.helpers.js";

describe("maskIp", () => {
	it("enmascara IPv4 dejando los dos primeros octetos", () => {
		expect(maskIp("203.0.113.42")).toBe("203.0.xxx.xxx");
	});
	it("null/empty → guión", () => {
		expect(maskIp(null)).toBe("—");
		expect(maskIp("")).toBe("—");
	});
	it("IPv6 no lanza", () => {
		expect(() => maskIp("2001:db8::1")).not.toThrow();
		expect(maskIp("2001:db8::1").length).toBeGreaterThan(0);
	});
});

describe("parseUserAgent", () => {
	it("extrae label usable de un UA móvil", () => {
		const { label } = parseUserAgent(
			"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
		);
		expect(label.toLowerCase()).toMatch(/chrome|android/);
	});
	it("UA vacío → Dispositivo desconocido", () => {
		expect(parseUserAgent(null).label).toBe("Dispositivo desconocido");
	});
});
