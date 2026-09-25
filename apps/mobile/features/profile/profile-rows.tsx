import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { ChevronRight } from "@/shared/ui/reicon";

export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View className="mt-8">
			<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
				{title}
			</Text>
			<View className="mt-3 overflow-hidden rounded-[20px] bg-konti-fill">{children}</View>
		</View>
	);
}

type ProfileRowProps = {
	label: string;
	onPress?: () => void;
	disabled?: boolean;
	trailing?: "chevron" | "soon" | ReactNode;
	danger?: boolean;
	loading?: boolean;
	border?: boolean;
};

export function ProfileRow({
	label,
	onPress,
	disabled = false,
	trailing = "chevron",
	danger = false,
	loading = false,
	border = true,
}: ProfileRowProps) {
	const labelClass = danger
		? "font-sans-medium text-[15px] text-konti-danger"
		: disabled
			? "font-sans-medium text-[15px] text-konti-ink-disabled"
			: "font-sans-medium text-[15px] text-konti-ink";

	const content = (
		<>
			<Text className={labelClass}>{label}</Text>
			{loading ? (
				<ActivityIndicator colorClassName="accent-konti-ink-muted" />
			) : trailing === "chevron" ? (
				<ChevronRight
					colorClassName={disabled ? "accent-konti-ink-disabled" : "accent-konti-ink-subtle"}
					size={18}
				/>
			) : trailing === "soon" ? (
				<Text className="font-sans text-[13px] text-konti-ink-disabled">Próximamente</Text>
			) : (
				trailing
			)}
		</>
	);

	if (onPress == null || disabled) {
		return (
			<View
				className={
					border
						? "min-h-14 flex-row items-center justify-between gap-3 border-b border-konti-border px-5 py-4"
						: "min-h-14 flex-row items-center justify-between gap-3 px-5 py-4"
				}
			>
				{content}
			</View>
		);
	}

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			disabled={loading}
			className={
				border
					? "min-h-14 flex-row items-center justify-between gap-3 border-b border-konti-border px-5 py-4 active:opacity-70"
					: "min-h-14 flex-row items-center justify-between gap-3 px-5 py-4 active:opacity-70"
			}
			onPress={onPress}
		>
			{content}
		</Pressable>
	);
}
