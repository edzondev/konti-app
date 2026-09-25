/**
 * Datos del titular / responsable legal.
 * Dummy hasta registrar la entidad real — un solo lugar para ambas páginas.
 */
export const legalEntity = {
	name: "Konti S.A.C.",
	taxId: "20601234567",
	address: "Av. José Pardo 123, Miraflores, Lima 15074, Perú",
	contactEmail: "hola@konti.dev",
	privacyEmail: "privacidad@konti.dev",
	jurisdiction: "Lima, Perú",
} as const;

const tokens: Record<string, string> = {
	"{{legalName}}": legalEntity.name,
	"{{taxId}}": legalEntity.taxId,
	"{{address}}": legalEntity.address,
	"{{contactEmail}}": legalEntity.contactEmail,
	"{{privacyEmail}}": legalEntity.privacyEmail,
	"{{jurisdiction}}": legalEntity.jurisdiction,
};

export function fillLegalTokens(text: string): string {
	let out = text;
	for (const [token, value] of Object.entries(tokens)) {
		out = out.replaceAll(token, value);
		// Markdown URL-encodes tokens inside href (e.g. mailto:)
		out = out.replaceAll(encodeURIComponent(token), value);
	}
	return out;
}
