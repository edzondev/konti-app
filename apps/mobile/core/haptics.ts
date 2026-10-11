import * as Haptics from "expo-haptics";

export type HapticIntent = "selection" | "success" | "error";

const NOTIFICATION_TYPE: Record<
	Exclude<HapticIntent, "selection">,
	Haptics.NotificationFeedbackType
> = {
	success: Haptics.NotificationFeedbackType.Success,
	error: Haptics.NotificationFeedbackType.Error,
};

export async function triggerHaptic(intent: HapticIntent): Promise<void> {
	try {
		if (intent === "selection") {
			await Haptics.selectionAsync();
			return;
		}

		await Haptics.notificationAsync(NOTIFICATION_TYPE[intent]);
	} catch {
		// Haptics are optional feedback and must never interrupt the action.
	}
}
