import { createHmac } from "node:crypto";

export function createDniBlindIndex(dni: string, secret: string) {
	if (!/^\d{8}$/.test(dni) || Buffer.byteLength(secret, "utf8") < 32) {
		throw new Error("DNI blind-index input is invalid");
	}

	return Object.freeze({
		blindIndex: createHmac("sha256", secret).update(`PE:DNI:${dni}`, "utf8").digest("hex"),
		last4: dni.slice(-4),
	});
}
