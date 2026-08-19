import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { UniSafeAreaView } from "@/shared/ui/safe-area";

type OnboardingShellProps = {
	eyebrow?: string;
	title: ReactNode;
	body?: ReactNode;
	children?: ReactNode;
	primaryLabel: string;
	onPrimaryPress: () => void;
	primaryDisabled?: boolean;
};

export function OnboardingShell({
	eyebrow,
	title,
	body,
	children,
	primaryLabel,
	onPrimaryPress,
	primaryDisabled = false,
}: OnboardingShellProps) {
	return (
		<UniSafeAreaView className="flex-1 justify-end bg-konti-canvas px-[34px] pb-10">
			<View className="gap-8">
				<View className="gap-4">
					{eyebrow ? (
						<Text className="font-mono text-[11px] uppercase tracking-[2px] text-konti-accent">
							{eyebrow}
						</Text>
					) : null}

					{title}

					{body ? (
						<Text className="text-base font-normal leading-6 text-konti-canvas-muted">{body}</Text>
					) : null}
				</View>

				{children}

				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: primaryDisabled }}
					className={`h-[58px] items-center justify-center rounded-[18px] bg-konti-button ${
						primaryDisabled ? "opacity-40" : "opacity-100"
					}`}
					disabled={primaryDisabled}
					onPress={onPrimaryPress}
				>
					<Text className="text-base font-medium text-konti-button-ink">{primaryLabel}</Text>
				</Pressable>
			</View>
		</UniSafeAreaView>
	);
}
