import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type Listener = (message: string) => void;

let listener: Listener | null = null;

export function showToast(message: string): void {
	listener?.(message);
}

const DISMISS_MS = 2500;

export function ToastHost() {
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		listener = (next) => {
			if (timer) clearTimeout(timer);
			setMessage(next);
			timer = setTimeout(() => setMessage(null), DISMISS_MS);
		};
		return () => {
			if (timer) clearTimeout(timer);
			listener = null;
		};
	}, []);

	if (message == null) return null;

	return (
		<View
			pointerEvents="none"
			className="absolute bottom-14 left-6 right-6 z-50 items-center"
		>
			<View className="rounded-2xl bg-konti-fill px-4 py-3">
				<Text className="text-center font-sans-medium text-[14px] text-konti-ink">{message}</Text>
			</View>
		</View>
	);
}
