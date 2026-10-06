import { legalEntity } from "./legal-entity";

/** Google Play listing. The button stays disabled until `launch.available`. */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.konti.app";

export const CONTACT_EMAIL = legalEntity.contactEmail;

export const SITE_URL = "https://konti.dev";

/** Paths with trailing slash (matches `trailingSlash: 'always'`). */
export const routes = {
	home: "/",
	terminos: "/terminos/",
	privacidad: "/privacidad/",
	comoFunciona: "/#como-funciona",
	porQueKonti: "/#por-que-konti",
	faq: "/#preguntas",
	descargar: "/#descargar",
} as const;
