import { afterEach, describe, expect, it, vi } from "vitest";

const haptics = vi.hoisted(() => ({
	selectionAsync: vi.fn<() => Promise<void>>(),
	notificationAsync: vi.fn<(type: string) => Promise<void>>(),
}));

vi.mock("expo-haptics", () => ({
	selectionAsync: haptics.selectionAsync,
	notificationAsync: haptics.notificationAsync,
	NotificationFeedbackType: {
		Success: "success",
		Warning: "warning",
		Error: "error",
	},
}));

import { triggerHaptic } from "./haptics";

describe("triggerHaptic", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("uses selection feedback only for a committed selection", async () => {
		haptics.selectionAsync.mockResolvedValueOnce();

		await triggerHaptic("selection");

		expect(haptics.selectionAsync).toHaveBeenCalledOnce();
		expect(haptics.notificationAsync).not.toHaveBeenCalled();
	});

	it.each(["success", "warning", "error"] as const)(
		"maps %s to notification feedback",
		async (intent) => {
			haptics.notificationAsync.mockResolvedValueOnce();

			await triggerHaptic(intent);

			expect(haptics.notificationAsync).toHaveBeenCalledWith(intent);
		},
	);

	it("does not let unavailable native haptics break the user action", async () => {
		haptics.notificationAsync.mockRejectedValueOnce(new Error("native haptics unavailable"));

		await expect(triggerHaptic("success")).resolves.toBeUndefined();
	});
});
