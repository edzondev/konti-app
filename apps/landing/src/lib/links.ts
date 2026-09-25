import { legalEntity } from "./legal-entity";

/** Placeholder until Google Play listing ID is available. */
export const PLAY_STORE_URL =
	"https://play.google.com/store/apps/details?id=pe.konti.app";

export const CONTACT_EMAIL = legalEntity.contactEmail;

export const SITE_URL = "https://konti.dev";

/** Paths with trailing slash (matches `trailingSlash: 'always'`). */
export const routes = {
	home: "/",
	terminos: "/terminos/",
	privacidad: "/privacidad/",
	comoFunciona: "/#como-funciona",
	faq: "/#faq",
	descargar: "/#descargar",
} as const;
