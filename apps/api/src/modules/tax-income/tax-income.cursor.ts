export type TaxIncomeCursor = {
	receivedAt: string;
	createdAt: string;
	id: string;
};

export function encodeTaxIncomeCursor(cursor: TaxIncomeCursor): string {
	return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeTaxIncomeCursor(cursor: string): TaxIncomeCursor {
	try {
		if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
		const payload = Buffer.from(cursor, "base64url");
		if (payload.toString("base64url") !== cursor) throw new Error();
		const decoded: unknown = JSON.parse(payload.toString("utf8"));
		if (typeof decoded !== "object" || decoded === null) throw new Error();
		const { receivedAt, createdAt, id } = decoded as Record<string, unknown>;
		if (
			typeof receivedAt !== "string" ||
			!/^2026-\d{2}-\d{2}$/.test(receivedAt) ||
			typeof createdAt !== "string" ||
			Number.isNaN(Date.parse(createdAt)) ||
			typeof id !== "string" ||
			!/^[-0-9a-f]{36}$/i.test(id)
		) {
			throw new Error();
		}

		return { receivedAt, createdAt, id };
	} catch {
		throw new Error("Invalid tax income cursor");
	}
}
