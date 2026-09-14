export const AUTH = Symbol("AUTH");

export const AUTH_APP_SCHEME = "appkonti";

export const AUTH_TRUSTED_ORIGINS = [
	`${AUTH_APP_SCHEME}://`,
	`${AUTH_APP_SCHEME}://*`,
	// Expo dev server (web / Expo Go)
	"http://localhost:8081",
	"http://localhost:19006",
] as const;
