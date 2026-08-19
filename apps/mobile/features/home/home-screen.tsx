import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeHeader } from "@/features/home/components/home-header";
import { initialsFromName } from "@/features/home/initials";
import type { HomePrimary } from "@/features/home/types";
import { useHome } from "@/features/home/use-home";

export function HomeScreen({ userId, firstName }: { userId: string; firstName?: string }) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const homeQuery = useHome(userId);
	const handleRetry = useCallback(() => {
		void homeQuery.refetch();
	}, [homeQuery]);
	const handleCapture = useCallback(() => {
		router.push("/guardar");
	}, [router]);

	return (
		<View className="flex-1 bg-konti-bg">
			<View style={{ paddingTop: insets.top }}>
				<HomeHeader firstName={firstName} initials={initialsFromName(firstName)} />
			</View>

			<View className="flex-1 items-center justify-center px-6 pb-28">
				{homeQuery.isPending ? (
					<LoadingState />
				) : homeQuery.isError ? (
					<ErrorState onRetry={handleRetry} />
				) : homeQuery.data.primary.action === "open_capture" ? (
					<FirstDocumentCta primary={homeQuery.data.primary} onPress={handleCapture} />
				) : (
					<NothingToReview primary={homeQuery.data.primary} />
				)}
			</View>
		</View>
	);
}

function LoadingState() {
	return <Text className="text-sm text-konti-ivory/50">Preparando tu inicio...</Text>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<View className="w-full max-w-[340px] items-center gap-5">
			<Text selectable className="text-center text-base leading-6 text-konti-ivory/50">
				No pudimos cargar tu inicio. Inténtalo de nuevo.
			</Text>
			<Pressable
				accessibilityRole="button"
				onPress={onRetry}
				className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
			>
				<Text className="text-sm font-semibold text-konti-bg">Reintentar</Text>
			</Pressable>
		</View>
	);
}

function FirstDocumentCta({ primary, onPress }: { primary: HomePrimary; onPress: () => void }) {
	const [pressed, setPressed] = useState(false);

	return (
		<View className="w-full max-w-[360px] items-center gap-6">
			<Text className="font-mono text-[11px] tracking-[3px] text-konti-primary">EMPEZANDO</Text>

			<View className="items-center gap-4">
				<Text className="text-center text-[38px] font-light leading-[44px] tracking-tight text-konti-ivory">
					{primary.title}
				</Text>
				<Text className="text-center text-base leading-6 text-konti-ivory/50">
					{primary.description}
				</Text>
			</View>

			<Pressable
				accessibilityRole="button"
				onPress={onPress}
				onPressIn={() => {
					setPressed(true);
				}}
				onPressOut={() => {
					setPressed(false);
				}}
				pressRetentionOffset={16}
			>
				<Animated.View
					className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
					style={{
						transform: [{ scale: pressed ? 0.97 : 1 }],
						transitionProperty: "transform",
						transitionDuration: "120ms",
						transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
					}}
				>
					<Text className="text-sm font-semibold text-konti-bg">Añadir comprobante</Text>
				</Animated.View>
			</Pressable>
		</View>
	);
}

function NothingToReview({ primary }: { primary: HomePrimary }) {
	return (
		<View className="w-full max-w-[360px] items-center gap-6">
			<Text className="font-mono text-[11px] tracking-[3px] text-konti-primary">EMPEZANDO</Text>

			<View className="items-center gap-4">
				<Text className="text-center text-[38px] font-light leading-[44px] tracking-tight text-konti-ivory">
					{primary.title}
				</Text>
				<Text className="text-center text-base leading-6 text-konti-ivory/50">
					{primary.description}
				</Text>
			</View>

			<Text className="text-center text-sm text-konti-ivory/50">No hay nada que configurar.</Text>
		</View>
	);
}
