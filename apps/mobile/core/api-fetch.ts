import { authClient } from "@/core/auth-client";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

function getBaseUrl(): string {
	const baseURL = process.env.EXPO_PUBLIC_API_URL;
	if (!baseURL) throw new Error("EXPO_PUBLIC_API_URL is not defined");
	return baseURL.replace(/\/$/, "");
}

function isJsonResponse(response: Response): boolean {
	const contentType = response.headers.get("content-type") ?? "";
	return contentType.includes("application/json");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	const cookie = await Promise.resolve(authClient.getCookie());
	const headers = new Headers(init.headers);
	if (cookie) headers.set("Cookie", cookie);
	if (!headers.has("Accept")) headers.set("Accept", "application/json");

	const normalized = path.startsWith("/") ? path : `/${path}`;
	const response = await fetch(`${getBaseUrl()}${normalized}`, {
		...init,
		headers,
		credentials: "omit",
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new ApiError(response.status, text || response.statusText);
	}

	if (response.status === 204 || !isJsonResponse(response)) {
		return undefined as T;
	}

	return (await response.json()) as T;
}
