import { authClient } from "@/core/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
	throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
	const cookies = authClient.getCookie();

	const headers = new Headers(options.headers);

	if (cookies) {
		headers.set("Cookie", cookies);
	}

	if (options.body !== undefined) {
		headers.set("Content-Type", "application/json");
	}

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers,
		credentials: "omit",
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		throw new Error(`API request failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}
