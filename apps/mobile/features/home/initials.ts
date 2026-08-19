export function initialsFromName(name: string | undefined) {
	const part = name?.trim().split(/\s+/)[0];
	return (part?.[0] ?? "K").toUpperCase();
}
