type DocumentCursor = {
	createdAt: string;
	id: string;
};

export function encodeDocumentCursor(cursor: DocumentCursor): string {
	return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeDocumentCursor(cursor: string): DocumentCursor {
	try {
		const decoded: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
		if (
			typeof decoded !== "object" ||
			decoded === null ||
			!Object.hasOwn(decoded, "createdAt") ||
			!Object.hasOwn(decoded, "id")
		) {
			throw new Error("Invalid document cursor");
		}
		const { createdAt, id } = decoded as Record<string, unknown>;
		if (
			typeof createdAt !== "string" ||
			typeof id !== "string" ||
			Number.isNaN(Date.parse(createdAt))
		) {
			throw new Error("Invalid document cursor");
		}

		return { createdAt, id };
	} catch {
		throw new Error("Invalid document cursor");
	}
}
