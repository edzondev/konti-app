import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DeleteAccountSheet } from "@/features/profile/delete-account-sheet";
import { ProfileRow, ProfileSection } from "@/features/profile/profile-rows";
import { useDeleteAccount } from "@/features/profile/use-delete-account";
import { useExportData } from "@/features/profile/use-export-data";
import { ChevronLeft } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

export function PrivacyScreen() {
	const router = useRouter();
	const { exportData, isExporting } = useExportData();
	const { openDeleteSheet } = useDeleteAccount();

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-8"
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
			>
				<Pressable
					accessibilityLabel="Volver"
					accessibilityRole="button"
					className="h-11 w-11 items-center justify-start"
					onPress={() => router.back()}
				>
					<ChevronLeft colorClassName="accent-konti-ink-muted" size={18} />
				</Pressable>

				<View className="mt-4 flex-row items-center gap-2">
					<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
					<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
						PRIVACIDAD
					</Text>
				</View>

				<Text className="mt-4 font-sans-light text-[32px] tracking-tight text-konti-ink">
					Tus <Text className="italic text-konti-amber">datos</Text>.
				</Text>

				<ProfileSection title="DATOS">
					<ProfileRow label="Exportar datos" loading={isExporting} onPress={exportData} />
					<ProfileRow
						label="Sesiones activas"
						onPress={() => {
							router.push("/sesiones");
						}}
						border={false}
					/>
				</ProfileSection>

				<View className="mt-10">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Eliminar cuenta"
						className="min-h-12 items-center justify-center py-3 active:opacity-70"
						onPress={openDeleteSheet}
					>
						<Text className="font-sans-medium text-[15px] text-konti-danger">Eliminar cuenta</Text>
					</Pressable>
				</View>
			</ScrollView>
			<DeleteAccountSheet />
		</UniSafeAreaView>
	);
}
