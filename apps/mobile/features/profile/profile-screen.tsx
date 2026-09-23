import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

import { DeleteAccountSheet } from "@/features/profile/delete-account-sheet";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/features/profile/legal";
import { ProfileRow, ProfileSection, ProfileValue } from "@/features/profile/profile-rows";
import { useCurrentUser } from "@/features/profile/use-current-user";
import { useDeleteAccount } from "@/features/profile/use-delete-account";
import { useSignOut } from "@/features/profile/use-sign-out";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

function initialFromName(name: string) {
	const trimmed = name.trim();
	return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : "?";
}

export function ProfileScreen() {
	const router = useRouter();
	const { user, isPending } = useCurrentUser();
	const { signOut } = useSignOut();
	const { openDeleteSheet } = useDeleteAccount();

	const name = user?.name ?? (isPending ? "…" : "—");
	const email = user?.email ?? "";
	const initial = user ? initialFromName(user.name) : "?";

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-28"
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
			>
				<Text className="font-sans-light text-[32px] tracking-tight text-konti-ink">Perfil</Text>

				<View className="mt-8 flex-row items-center gap-4">
					<View className="size-14 items-center justify-center rounded-full bg-konti-amber-tint">
						<Text className="font-sans-medium text-[22px] text-konti-amber">{initial}</Text>
					</View>
					<View className="min-w-0 flex-1">
						<Text className="font-sans-medium text-[18px] tracking-tight text-konti-ink">
							{name}
						</Text>
						{email.length > 0 ? (
							<Text className="mt-0.5 text-[14px] text-konti-ink-muted" numberOfLines={1}>
								{email}
							</Text>
						) : null}
					</View>
				</View>

				<ProfileSection title="PLAN">
					<ProfileRow label="Tu plan" trailing={<ProfileValue>Gratis</ProfileValue>} border={false} />
				</ProfileSection>

				<ProfileSection title="CUENTA">
					<ProfileRow
						label="Privacidad y datos"
						onPress={() => {
							router.push("/privacidad");
						}}
					/>
					<ProfileRow label="Notificaciones" disabled trailing="soon" />
					<ProfileRow label="Apariencia" disabled trailing="soon" border={false} />
				</ProfileSection>

				<ProfileSection title="LEGAL">
					<ProfileRow
						label="Términos"
						onPress={() => {
							void Linking.openURL(TERMS_URL);
						}}
					/>
					<ProfileRow
						label="Política de privacidad"
						onPress={() => {
							void Linking.openURL(PRIVACY_POLICY_URL);
						}}
						border={false}
					/>
				</ProfileSection>

				<View className="mt-10 gap-1">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Cerrar sesión"
						className="min-h-12 items-center justify-center py-3 active:opacity-70"
						onPress={() => {
							void signOut();
						}}
					>
						<Text className="font-sans-medium text-[15px] text-konti-ink">Cerrar sesión</Text>
					</Pressable>
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
