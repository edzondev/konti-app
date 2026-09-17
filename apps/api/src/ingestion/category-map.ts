export const CATEGORIES = [
	"restaurantes",
	"supermercado",
	"transporte",
	"servicios_medicos",
	"servicios_profesionales",
	"hogar_servicios",
	"entretenimiento",
	"educacion",
	"otros",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
	restaurantes: "Restaurantes",
	supermercado: "Supermercado",
	transporte: "Transporte",
	servicios_medicos: "Servicios médicos",
	servicios_profesionales: "Servicios profesionales",
	hogar_servicios: "Hogar y servicios",
	entretenimiento: "Entretenimiento",
	educacion: "Educación",
	otros: "Otros",
};

/** Claves normalizadas (lowercase, sin tildes) → categoría. */
export const CATEGORY_MAP: Record<string, Category> = {
	// restaurantes
	osaka: "restaurantes",
	"la lucha": "restaurantes",
	tanta: "restaurantes",
	"la mar": "restaurantes",
	pardos: "restaurantes",
	"pardos chicken": "restaurantes",
	bembos: "restaurantes",
	kfc: "restaurantes",
	"pizza hut": "restaurantes",
	"burger king": "restaurantes",
	mcdonalds: "restaurantes",
	"mc donalds": "restaurantes",
	starbucks: "restaurantes",
	"juan valdez": "restaurantes",
	"punto azul": "restaurantes",
	"chino walon": "restaurantes",
	"el señor de huanca": "restaurantes",
	norkys: "restaurantes",
	rokys: "restaurantes",
	"papa johns": "restaurantes",
	"domino s": "restaurantes",
	dominos: "restaurantes",
	subway: "restaurantes",
	"chili s": "restaurantes",
	tgif: "restaurantes",
	"segundo muelle": "restaurantes",
	"el honesto mike": "restaurantes",
	central: "restaurantes",
	maido: "restaurantes",
	isola: "restaurantes",
	"cafe emasa": "restaurantes",

	// supermercado
	"plaza vea": "supermercado",
	wong: "supermercado",
	metro: "supermercado",
	tottus: "supermercado",
	vivanda: "supermercado",
	makro: "supermercado",
	mass: "supermercado",
	vea: "supermercado",
	"super maxi": "supermercado",
	oxxo: "supermercado",
	listo: "supermercado",
	tambo: "supermercado",
	spar: "supermercado",

	// transporte
	uber: "transporte",
	cabify: "transporte",
	beat: "transporte",
	"taxi directo": "transporte",
	indriver: "transporte",
	didi: "transporte",
	primax: "transporte",
	repsol: "transporte",
	pecsa: "transporte",
	gnv: "transporte",
	petroperu: "transporte",
	"petro peru": "transporte",
	metropolitano: "transporte",
	"linea 1": "transporte",
	"corredor azul": "transporte",
	"corredor rojo": "transporte",
	"lima airport partners": "transporte",

	// servicios_medicos
	"clinica delgado": "servicios_medicos",
	"clinica internacional": "servicios_medicos",
	"clinica javier prado": "servicios_medicos",
	"clinica ricardo palma": "servicios_medicos",
	"ricardo palma": "servicios_medicos",
	inkafarma: "servicios_medicos",
	mifarma: "servicios_medicos",
	botica: "servicios_medicos",
	"boticas peru": "servicios_medicos",
	policlinico: "servicios_medicos",
	"san pablo": "servicios_medicos",
	oncosalud: "servicios_medicos",
	auna: "servicios_medicos",
	"pacifico seguros": "servicios_medicos",
	rimac: "servicios_medicos",
	sanitas: "servicios_medicos",
	laboratorio: "servicios_medicos",

	// servicios_profesionales
	"estudio contable": "servicios_profesionales",
	"estudio juridico": "servicios_profesionales",
	abogado: "servicios_profesionales",
	contador: "servicios_profesionales",
	consultor: "servicios_profesionales",
	arquitecto: "servicios_profesionales",
	notaria: "servicios_profesionales",
	"asesoria legal": "servicios_profesionales",

	// hogar_servicios
	"luz del sur": "hogar_servicios",
	enel: "hogar_servicios",
	sedapal: "hogar_servicios",
	movistar: "hogar_servicios",
	claro: "hogar_servicios",
	entel: "hogar_servicios",
	bitel: "hogar_servicios",
	calidda: "hogar_servicios",
	"pluz energia": "hogar_servicios",
	electroperu: "hogar_servicios",
	win: "hogar_servicios",
	wow: "hogar_servicios",
	directv: "hogar_servicios",

	// entretenimiento
	cinemark: "entretenimiento",
	cineplanet: "entretenimiento",
	netflix: "entretenimiento",
	spotify: "entretenimiento",
	steam: "entretenimiento",
	disney: "entretenimiento",
	"disney plus": "entretenimiento",
	hbo: "entretenimiento",
	"hbo max": "entretenimiento",
	"amazon prime": "entretenimiento",
	"youtube premium": "entretenimiento",
	"apple music": "entretenimiento",
	"play station": "entretenimiento",
	playstation: "entretenimiento",

	// educacion
	universidad: "educacion",
	pucp: "educacion",
	upc: "educacion",
	ulima: "educacion",
	"universidad de lima": "educacion",
	usil: "educacion",
	instituto: "educacion",
	colegio: "educacion",
	academia: "educacion",
	idiomas: "educacion",
	britanico: "educacion",
	icpna: "educacion",
};

const NORMALIZE_MAP: Record<string, string> = {
	á: "a",
	é: "e",
	í: "i",
	ó: "o",
	ú: "u",
	ü: "u",
	ñ: "n",
	Á: "a",
	É: "e",
	Í: "i",
	Ó: "o",
	Ú: "u",
	Ü: "u",
	Ñ: "n",
};

export function normalizeIssuerName(raw: string): string {
	let out = raw.toLowerCase().trim();
	out = out.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, (ch) => NORMALIZE_MAP[ch] ?? ch);
	out = out.replace(/[^a-z0-9\s]/g, " ");
	out = out.replace(/\s+/g, " ").trim();
	return out;
}

/**
 * Categoriza solo por nombre (pura). Busca si el nombre normalizado
 * contiene alguna clave del mapa; la más larga gana.
 */
export function categorizeByName(name: string | null | undefined): Category {
	if (!name?.trim()) return "otros";

	const normalized = normalizeIssuerName(name);
	if (!normalized) return "otros";

	let bestKey = "";
	let bestCategory: Category = "otros";

	for (const [key, category] of Object.entries(CATEGORY_MAP)) {
		if (normalized.includes(key) && key.length > bestKey.length) {
			bestKey = key;
			bestCategory = category;
		}
	}

	return bestCategory;
}

export function categoryLabel(category: Category): string {
	return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.otros;
}

export const DEDUCTIBLE_CATEGORIES: readonly Category[] = [
	"restaurantes",
	"servicios_medicos",
	"servicios_profesionales",
] as const;
