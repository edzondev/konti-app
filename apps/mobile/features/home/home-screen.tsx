import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeHeader } from "@/features/home/components/home-header";
import { initialsFromName } from "@/features/home/initials";
import { useHome } from "@/features/home/use-home";

export function HomeScreen({ userId, firstName }: { userId: string; firstName?: string }) {
	const insets = useSafeAreaInsets();
	const homeQuery = useHome(userId);

	return (
		<View className="flex-1 bg-konti-bg">
			<View style={{ paddingTop: insets.top }}>
				<HomeHeader firstName={firstName} initials={initialsFromName(firstName)} />
			</View>

			<View className="flex-1 items-center justify-center px-6 pb-28">
				{homeQuery.isPending ? (
					<LoadingState />
				) : homeQuery.isError ? (
					<ErrorState
						onRetry={() => {
							void homeQuery.refetch();
						}}
					/>
				) : homeQuery.data.primary.code === "NOTHING_TO_REVIEW" ? (
					<NothingToReview description={homeQuery.data.primary.description} />
				) : null}
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

function NothingToReview({ description }: { description: string }) {
	return (
		<View className="w-full max-w-[360px] items-center gap-6">
			<Text className="font-mono text-[11px] tracking-[3px] text-konti-primary">EMPEZANDO</Text>

			<View className="items-center gap-4">
				<Text className="text-center text-[38px] font-light leading-[44px] tracking-tight text-konti-ivory">
					Aún no hay nada que <Text className="italic text-konti-primary">revisar</Text>.
				</Text>
				<Text className="text-center text-base leading-6 text-konti-ivory/50">{description}</Text>
			</View>

			<Text className="text-center text-sm text-konti-ivory/50">No hay nada que configurar.</Text>
		</View>
	);
}
