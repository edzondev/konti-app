import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";

import { type Document } from "@/features/comprobantes/comprobantes-document";
import { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from "@/features/comprobantes/document-form";
import { useDeleteDocument, useDocumentImage } from "@/features/comprobantes/use-comprobantes";
import { formatMoney } from "@/features/home/home-format";
import { Camera, Receipt } from "@/shared/ui/reicon";

const SOURCE_LABELS: Record<Document["source"], string> = {
	camera: "Cámara",
	gallery: "Galería",
	share: "Compartido",
};

function displayDate(isoDate: string): string {
	const [year, month, day] = isoDate.split("-");
	return `${day}/${month}/${year}`;
}

function ImageSkeleton() {
	return (
		<View className="h-40 items-center justify-center rounded-2xl bg-konti-fill px-8">
			<View className="w-full gap-2.5">
				<View className="h-2.5 w-48 rounded-full bg-konti-skeleton" />
				<View className="h-2.5 w-full rounded-full bg-konti-skeleton" />
				<View className="h-2.5 w-56 rounded-full bg-konti-skeleton" />
			</View>
		</View>
	);
}

function DocumentImagePreview({ id }: { id: string }) {
	const imageQuery = useDocumentImage(id, true);

	if (imageQuery.isPending) {
		return <ImageSkeleton />;
	}

	if (imageQuery.isError || !imageQuery.data) {
		return (
			<View className="h-40 items-center justify-center rounded-2xl bg-konti-fill">
				<Camera size={28} colorClassName="accent-konti-ink-faint" />
			</View>
		);
	}

	return (
		<View className="h-40 w-full overflow-hidden rounded-2xl bg-konti-fill">
			<NitroImage
				image={{ filePath: imageQuery.data }}
				recyclingKey={id}
				resizeMode="cover"
				style={{ width: "100%", height: "100%" }}
			/>
		</View>
	);
}

function ManualPendingBody({ onEdit }: { onEdit: () => void }) {
	return (
		<View>
			<Text className="mt-6 font-sans-light text-[28px] text-konti-ink">
				Completa los datos a mano.
			</Text>
			<Text className="mt-3 text-[15px] text-konti-ink-muted">
				Este comprobante no se leyó solo. Ingresa los campos.
			</Text>
			<Pressable
				onPress={onEdit}
				className="mt-6 h-14 items-center justify-center rounded-full bg-konti-ink"
			>
				<Text className="font-sans-medium text-konti-on-ink">Completar datos</Text>
			</Pressable>
		</View>
	);
}

function PendingBody() {
	return (
		<View>
			<View className="h-36 items-center justify-center rounded-2xl bg-konti-fill">
				<Receipt size={28} colorClassName="accent-konti-ink-muted" />
			</View>
			<Text className="mt-6 font-sans-light text-[28px] text-konti-ink">
				Leyendo tu comprobante.
			</Text>
			<Text className="mt-3 text-[15px] text-konti-ink-muted">
				Esto suele tomar unos segundos. Puedes cerrar esta pantalla.
			</Text>
			<View className="mt-8 h-1 w-16 rounded-full bg-konti-amber" />
		</View>
	);
}

function FailedBody({
	id,
	onEdit,
	onDelete,
	onClose,
}: {
	id: string;
	onEdit: () => void;
	onDelete: () => void;
	onClose: () => void;
}) {
	return (
		<View>
			<DocumentImagePreview id={id} />
			<View className="mt-6 flex-row items-center gap-2">
				<View className="h-1.5 w-1.5 rounded-full bg-konti-amber" />
				<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
					LECTURA FALLIDA
				</Text>
			</View>
			<Text className="mt-3 font-sans-light text-[32px] text-konti-ink">
				No pudimos <Text className="text-konti-amber-deep">leerlo</Text>
			</Text>
			<Text className="mt-3 text-konti-ink-muted">
				La foto no es lo bastante clara. Puedes intentar de nuevo o ingresar los datos a mano.
			</Text>
			<Pressable
				onPress={() => {
					onClose();
					router.push("/guardar");
				}}
				className="mt-6 h-14 items-center justify-center rounded-full bg-konti-ink"
			>
				<Text className="font-sans-medium text-konti-on-ink">Reintentar</Text>
			</Pressable>
			<Pressable
				onPress={onEdit}
				className="mt-3 h-14 items-center justify-center rounded-full border border-konti-border"
			>
				<Text className="text-konti-ink">Ingresar a mano</Text>
			</Pressable>
			<Pressable onPress={onDelete}>
				<Text className="mt-4 text-center text-konti-danger">Eliminar comprobante</Text>
			</Pressable>
		</View>
	);
}

function ReadyBody({
	document,
	onEdit,
	onDelete,
}: {
	document: Document;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const rows = [
		{
			label: "Fecha",
			value: document.issueDate ? displayDate(document.issueDate) : "Sin completar",
		},
		{ label: "Categoría", value: CATEGORY_LABELS[document.category] },
		{ label: "RUC", value: document.issuerTaxId ?? "Sin completar" },
		{ label: "Tipo", value: DOCUMENT_TYPE_LABELS[document.documentType] },
		{ label: "Número boleta", value: document.documentNumber ?? "Sin completar" },
		{ label: "Origen", value: SOURCE_LABELS[document.source] },
	];
	const amountLabel =
		document.totalAmount === null ? "S/ 0.00" : `S/ ${formatMoney(Number(document.totalAmount))}`;

	return (
		<View>
			<DocumentImagePreview id={document.id} />
			<Text className="mt-6 font-sans-light text-[32px] text-konti-ink">
				{document.issuerName?.trim() || "Comprobante"}
			</Text>
			<Text className="mt-2 font-sans-medium text-4xl text-konti-ink">{amountLabel}</Text>
			{rows.map((row) => (
				<View
					key={row.label}
					className="flex-row justify-between border-b border-konti-border py-3"
				>
					<Text className="text-konti-ink-muted">{row.label}</Text>
					<Text className="text-konti-ink">{row.value}</Text>
				</View>
			))}
			<Pressable
				onPress={onEdit}
				className="mt-6 h-14 items-center justify-center rounded-full border border-konti-border"
			>
				<Text className="text-konti-ink">Editar información</Text>
			</Pressable>
			<Pressable onPress={onDelete}>
				<Text className="mt-4 text-center text-konti-danger">Eliminar comprobante</Text>
			</Pressable>
		</View>
	);
}

export function DocumentScreen({
	document,
	onEdit,
	onClose,
}: {
	document: Document;
	onEdit: () => void;
	onClose: () => void;
}) {
	const deletion = useDeleteDocument(document.id);

	function onDelete() {
		if (deletion.isPending) return;
		Alert.alert("¿Eliminar comprobante?", "Esta acción no se puede deshacer.", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Eliminar",
				style: "destructive",
				onPress: () => {
					deletion.mutate(undefined, { onSuccess: onClose });
				},
			},
		]);
	}

	return (
		<View className="flex-1 bg-konti-bg">
			<ScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="px-2 pb-10"
			>
				{document.status === "pending" && document.extractionSource === "manual" ? (
					<ManualPendingBody onEdit={onEdit} />
				) : null}
				{document.status === "pending" && document.extractionSource !== "manual" ? (
					<PendingBody />
				) : null}
				{document.status === "failed" ? (
					<FailedBody id={document.id} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />
				) : null}
				{document.status === "ready" ? (
					<ReadyBody document={document} onEdit={onEdit} onDelete={onDelete} />
				) : null}
				{deletion.isError ? (
					<Text className="mt-3 text-center text-[12px] text-konti-danger">
						No pudimos eliminar el comprobante.
					</Text>
				) : null}
			</ScrollView>
		</View>
	);
}
