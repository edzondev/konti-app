import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useRevokeSession } from "@/features/profile/use-revoke-session";
import { useSessions, type MeSession } from "@/features/profile/use-sessions";
import { ChevronLeft } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

function SessionRow({
	session,
	onRevoke,
	revoking,
}: {
	session: MeSession;
	onRevoke: (id: string) => void;
	revoking: boolean;
}) {
	return (
		<View className="rounded-[20px] bg-konti-fill px-5 py-4">
			<View className="flex-row items-start justify-between gap-3">
				<View className="min-w-0 flex-1">
					<Text className="font-sans-medium text-[15px] tracking-tight text-konti-ink">
						{session.label}
					</Text>
					<Text className="mt-1 text-[13px] text-konti-ink-muted">{session.ipMasked}</Text>
				</View>
				{session.isCurrent ? (
					<View className="rounded-full bg-konti-amber-tint px-2.5 py-1">
						<Text className="font-sans-medium text-[11px] text-konti-amber">Este dispositivo</Text>
					</View>
				) : (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Revocar sesión"
						disabled={revoking}
						className="active:opacity-70"
						onPress={() => onRevoke(session.id)}
					>
						<Text className="font-sans-medium text-[14px] text-konti-danger">Revocar</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}

export function SessionsScreen() {
	const router = useRouter();
	const query = useSessions();
	const revoke = useRevokeSession();

	function confirmRevoke(id: string) {
		if (revoke.isPending) return;
		Alert.alert("¿Revocar sesión?", "Tendrás que iniciar sesión de nuevo en ese dispositivo.", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Revocar",
				style: "destructive",
				onPress: () => {
					revoke.mutate(id);
				},
			},
		]);
	}

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
						SESIONES
					</Text>
				</View>

				<Text className="mt-4 font-sans-light text-[32px] tracking-tight text-konti-ink">
					Dónde estás <Text className="italic text-konti-amber">conectado</Text>.
				</Text>

				{query.isPending ? (
					<View className="mt-8 gap-3">
						<View className="h-20 w-full rounded-[20px] bg-konti-skeleton" />
						<View className="h-20 w-full rounded-[20px] bg-konti-skeleton" />
					</View>
				) : query.isError ? (
					<View className="mt-12">
						<Text className="font-sans text-[15px] text-konti-ink-muted">
							No se pudieron cargar las sesiones.
						</Text>
						<Pressable
							accessibilityLabel="Reintentar"
							accessibilityRole="button"
							className="mt-4 self-start"
							onPress={() => {
								void query.refetch();
							}}
						>
							<Text className="font-sans-medium text-[15px] text-konti-amber">Reintentar</Text>
						</Pressable>
					</View>
				) : query.data != null && query.data.length > 0 ? (
					<View className="mt-8 gap-2.5">
						{query.data.map((session) => (
							<SessionRow
								key={session.id}
								session={session}
								onRevoke={confirmRevoke}
								revoking={revoke.isPending}
							/>
						))}
					</View>
				) : (
					<Text className="mt-10 text-[15px] leading-6 text-konti-ink-muted">
						No hay sesiones activas.
					</Text>
				)}
			</ScrollView>
		</UniSafeAreaView>
	);
}
