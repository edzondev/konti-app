import { apiClient } from "@/core/api-client";

import type { CurrentTaxProfileResponse, UpdateTaxProfileInput } from "./types";

export function getCurrentTaxProfile() {
	return apiClient<CurrentTaxProfileResponse>("/v1/tax-profile/current");
}

export function updateCurrentTaxProfile(input: UpdateTaxProfileInput) {
	return apiClient<CurrentTaxProfileResponse>("/v1/tax-profile/current", {
		method: "PUT",
		body: input,
	});
}
