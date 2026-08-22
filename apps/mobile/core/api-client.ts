import { ApiError } from "@/core/api-error";
import { authClient } from "@/core/auth-client";
import { createDevLogger } from "@/core/dev-logger";

const log = createDevLogger("api");

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
	throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
	const cookies = await authClient.getCookie();

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

	if (response.status === 204) {
		return undefined as T;
	}

	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			code?: string;
			message?: string;
		} | null;

		const error = new ApiError(
			response.status,
			body?.message ?? `API request failed with status ${response.status}`,
			body?.code,
		);
		log.error(path, error.status, error.message);
		throw error;
	}

	return response.json() as Promise<T>;
}
