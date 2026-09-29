export function previewQrText(raw: string): string {
	const trimmed = raw.trim();
	const host = trimmed.match(/^https?:\/\/(?:www\.)?([^/?#]+)/i)?.[1];
	return host ?? trimmed;
}
