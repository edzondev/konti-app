import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { createDocumentFileUrl } from "@/features/documents/documents.api";
import { useDocument } from "@/features/documents/use-document";

function sourceLabel(source: "camera" | "gallery") {
	return source === "camera" ? "Cámara" : "Galería";
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	dateStyle: "long",
	timeStyle: "short",
});

export default function DocumentScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const documentId = typeof id === "string" ? id : "";
	const { data: session } = authClient.useSession();
	const documentQuery = useDocument(session?.user.id ?? "", documentId);
	const fileUrlQuery = useQuery({
		queryKey: ["documents", "file-url", session?.user.id, documentId],
		queryFn: () => createDocumentFileUrl(documentId),
		enabled: Boolean(session?.user.id && documentId && documentQuery.data),
		gcTime: 0,
		staleTime: 0,
	});

	if (documentQuery.isPending) {
		return <ScreenState message="Cargando comprobante…" />;
	}

	if (documentQuery.isError || !documentQuery.data) {
		return <ScreenState message="No pudimos cargar este comprobante." />;
	}

	const { document } = documentQuery.data;

	return (
		<View className="flex-1 bg-konti-bg px-5" style={{ paddingTop: insets.top + 12 }}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Volver a comprobantes"
				hitSlop={12}
				onPress={() => {
					router.back();
				}}
				className="min-h-11 self-start justify-center"
			>
				<Text className="text-[15px] font-medium text-konti-primary">Volver</Text>
			</Pressable>

			<View className="my-4 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-konti-surface">
				{fileUrlQuery.data ? (
					<Image
						accessibilityLabel="Imagen del comprobante"
						cachePolicy="memory"
						contentFit="contain"
						source={fileUrlQuery.data.url}
						style={{ alignSelf: "stretch", flex: 1 }}
					/>
				) : (
					<Text className="text-[15px] text-konti-ivory/50">
						{fileUrlQuery.isError
							? "No pudimos cargar la imagen."
							: "Cargando imagen del comprobante…"}
					</Text>
				)}
			</View>

			<View className="gap-1 pb-6">
				<Text className="text-[17px] font-medium text-konti-ivory">
					{sourceLabel(document.source)}
				</Text>
				<Text className="text-[14px] text-konti-ivory/50">
					{DATE_FORMATTER.format(new Date(document.createdAt))}
				</Text>
				<Text className="text-[14px] text-konti-primary">Guardado</Text>
			</View>
		</View>
	);
}

function ScreenState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-6">
			<Text className="text-center text-[15px] leading-[21px] text-konti-ivory/60">{message}</Text>
		</View>
	);
}
