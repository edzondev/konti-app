import { apiClient } from "@/core/api-client";

import type { HomeResponse } from "./types";

export function getHome() {
	return apiClient<HomeResponse>("/v1/home");
}
