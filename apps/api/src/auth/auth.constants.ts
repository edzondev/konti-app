export const AUTH = Symbol("AUTH");

export const AUTH_APP_SCHEME = "appkonti";

export const AUTH_TRUSTED_ORIGINS = [`${AUTH_APP_SCHEME}://`, `${AUTH_APP_SCHEME}://*`] as const;
