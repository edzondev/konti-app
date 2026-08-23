import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/core/api-client";
import { ApiError } from "@/core/api-error";

import { getHome } from "./home.api";
import type { HomeResponse } from "./types";

vi.mock("@/core/api-client", () => ({ apiClient: vi.fn() }));

const home: HomeResponse = {
	status: "calculated",
	taxYear: 2026,
	primary: {
		code: "VIEW_TAX_STATUS",
		title: "Estimación actualizada",
		description: "Con tus datos registrados hasta hoy.",
		action: "open_tax_status",
	},
	attention: { count: 0, nextItem: null },
	taxSummary: null,
	summary: {
		processedDocuments: 0,
		processingDocuments: 0,
		potentiallyRelevantAmount: null,
	},
	nextRelevantEvent: null,
	updatedAt: "2026-08-23T12:00:00.000Z",
};

describe("getHome", () => {
	beforeEach(() => {
		vi.mocked(apiClient).mockReset();
	});

	it("uses the Phase 4.7 read model in one request", async () => {
		vi.mocked(apiClient).mockResolvedValueOnce(home);

		await expect(getHome()).resolves.toBe(home);

		expect(apiClient).toHaveBeenCalledTimes(1);
		expect(apiClient).toHaveBeenCalledWith("/v1/home/current");
	});

	it("falls back to the legacy endpoint only when the new route is absent", async () => {
		vi.mocked(apiClient)
			.mockRejectedValueOnce(new ApiError(404, "Not found"))
			.mockResolvedValueOnce(home);

		await expect(getHome()).resolves.toBe(home);

		expect(apiClient).toHaveBeenNthCalledWith(1, "/v1/home/current");
		expect(apiClient).toHaveBeenNthCalledWith(2, "/v1/home");
	});

	it("keeps authentication and server failures visible", async () => {
		const unauthorized = new ApiError(401, "Unauthorized");
		vi.mocked(apiClient).mockRejectedValueOnce(unauthorized);

		await expect(getHome()).rejects.toBe(unauthorized);

		expect(apiClient).toHaveBeenCalledTimes(1);
	});
});
