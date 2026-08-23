import { apiClient } from "@/core/api-client";
import { isApiError } from "@/core/api-error";

import type { HomeResponse } from "./types";

export async function getHome() {
	try {
		return await apiClient<HomeResponse>("/v1/home/current");
	} catch (error) {
		if (!isApiError(error) || error.status !== 404) throw error;
		return apiClient<HomeResponse>("/v1/home");
	}
}
