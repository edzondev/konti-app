export const AUTH = Symbol("AUTH");

export const AUTH_APP_SCHEME = "appkonti";

export const AUTH_TRUSTED_ORIGINS = [
	`${AUTH_APP_SCHEME}://`,
	`${AUTH_APP_SCHEME}://*`,
	"http://localhost:3000",
	"http://localhost:8081",
	"http://localhost:19006",
] as const;
