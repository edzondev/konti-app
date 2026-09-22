import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Alert, View } from "react-native";

import {
	BottomSheet,
	Button,
	Column,
	FieldGroup,
	ListItem,
	Picker,
	RNHostView,
	Text,
	TextInput,
	useNativeState,
} from "@expo/ui";

import { triggerHaptic } from "@/core/haptics";
import type {
	DocumentListItem,
	DocumentType,
	UpdateDocumentInput,
} from "@/features/documents/document";
import {
	categoryLabel,
	DOCUMENT_TYPE_OPTIONS,
	documentTypeLabel,
	formatIssueDate,
	formatSoles,
	isExtractionIncomplete,
	sourceLabel,
} from "@/features/documents/document-ui";
import {
	useDeleteDocument,
	useDocument,
	useDocumentImage,
	useUpdateDocument,
} from "@/features/documents/use-documents";
import { Camera, Receipt } from "@/shared/ui/reicon";

export function DocumentSheet() {
	const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
	const { data: doc, isPending } = useDocument(id);
	const [editing, setEdit] = useState(edit === "1");

	function dismiss() {
		router.back();
	}

	if (!id) return null;

	if (isPending && !doc) {
		return (
			<Sheet onDismiss={dismiss}>
				<Column spacing={12}>
					<Text textStyle={{ fontSize: 17 }}>Cargando…</Text>
				</Column>
			</Sheet>
		);
	}

	if (!doc) {
		return (
			<Sheet onDismiss={dismiss}>
				<Column spacing={12}>
					<Text textStyle={{ fontSize: 17 }}>No encontramos este comprobante.</Text>
					<Button label="Cerrar" onPress={dismiss} />
				</Column>
			</Sheet>
		);
	}

	if (editing) {
		return <EditForm doc={doc} onCancel={() => setEdit(false)} onDismiss={dismiss} />;
	}

	if (doc.status === "pending") {
		return (
			<Sheet onDismiss={dismiss}>
				<Column spacing={12}>
					<DocHero icon="receipt" />
					<Text textStyle={{ fontSize: 22, fontWeight: "600" }}>Leyendo tu comprobante.</Text>
					<Text textStyle={{ fontSize: 15, color: "#737373" }}>
						Esto suele tomar unos segundos. Puedes cerrar esta pantalla.
					</Text>
				</Column>
			</Sheet>
		);
	}

	const failed =
		doc.status === "failed" || (doc.status === "ready" && isExtractionIncomplete(doc));

	if (failed) {
		return (
			<Sheet onDismiss={dismiss} snapPoints={["half", "full"]}>
				<FieldGroup>
					<FieldGroup.Section>
						<DocHero id={doc.id} icon="camera" />
						<Text textStyle={{ fontSize: 22, fontWeight: "600" }}>No pudimos leerlo</Text>
						<Text textStyle={{ fontSize: 15, color: "#737373" }}>
							La foto no es lo bastante clara. Puedes intentar de nuevo o ingresar los datos a
							mano.
						</Text>
					</FieldGroup.Section>
					<FieldGroup.Section>
						<Button
							label="Reintentar"
							onPress={() => {
								void triggerHaptic("selection");
								router.replace("/guardar");
							}}
						/>
						<Button
							label="Ingresar a mano"
							variant="outlined"
							onPress={() => {
								void triggerHaptic("selection");
								setEdit(true);
							}}
						/>
						<DeleteButton id={doc.id} />
					</FieldGroup.Section>
				</FieldGroup>
			</Sheet>
		);
	}

	return (
		<Sheet onDismiss={dismiss} snapPoints={["half", "full"]}>
			<FieldGroup>
				<FieldGroup.Section>
					<DocHero id={doc.id} icon="receipt" />
					<Text textStyle={{ fontSize: 22, fontWeight: "600" }}>
						{doc.issuerName ?? "Comprobante"}
					</Text>
					<Text textStyle={{ fontSize: 28, fontWeight: "600" }}>
						{formatSoles(doc.totalAmount)}
					</Text>
				</FieldGroup.Section>
				<FieldGroup.Section title="Detalle">
					<ListItem trailing={formatIssueDate(doc.issueDate)}>Fecha</ListItem>
					<ListItem trailing={categoryLabel(doc.category)}>Categoría</ListItem>
					<ListItem trailing={doc.issuerTaxId || "—"}>RUC</ListItem>
					<ListItem trailing={documentTypeLabel(doc.documentType)}>Tipo</ListItem>
					<ListItem trailing={doc.documentNumber || "—"}>Número</ListItem>
					<ListItem trailing={sourceLabel(doc.source)}>Origen</ListItem>
				</FieldGroup.Section>
				<FieldGroup.Section>
					<Button
						label="Editar información"
						variant="outlined"
						onPress={() => {
							void triggerHaptic("selection");
							setEdit(true);
						}}
					/>
					<DeleteButton id={doc.id} />
				</FieldGroup.Section>
			</FieldGroup>
		</Sheet>
	);
}

function Sheet({
	children,
	onDismiss,
	snapPoints,
}: {
	children: ReactNode;
	onDismiss: () => void;
	snapPoints?: Array<"half" | "full">;
}) {
	return (
		<BottomSheet
			isPresented
			onDismiss={onDismiss}
			showDragIndicator
			snapPoints={snapPoints}
			contentPadding={0}
			containerColor="#fff"
		>
			{children}
		</BottomSheet>
	);
}

function EditForm({
	doc,
	onCancel,
	onDismiss,
}: {
	doc: DocumentListItem;
	onCancel: () => void;
	onDismiss: () => void;
}) {
	const { mutateAsync, isPending } = useUpdateDocument();
	const [error, setError] = useState<string | null>(null);

	const issuerName = useNativeState(doc.issuerName ?? "");
	const issuerTaxId = useNativeState(doc.issuerTaxId ?? "");
	const issueDate = useNativeState(isoToDisplay(doc.issueDate));
	const documentNumber = useNativeState(doc.documentNumber ?? "");
	const totalAmount = useNativeState(doc.totalAmount ?? "");
	const igvAmount = useNativeState(doc.igvAmount ?? "");
	const [documentType, setDocumentType] = useState<DocumentType>(
		doc.documentType === "unknown" ? "boleta" : (doc.documentType as DocumentType),
	);

	async function save() {
		setError(null);
		const patch: UpdateDocumentInput = {
			issuerName: trimOrNull(issuerName.value),
			issuerTaxId: trimOrNull(issuerTaxId.value),
			issueDate: displayToIso(issueDate.value),
			documentType,
			documentNumber: trimOrNull(documentNumber.value),
			totalAmount: parseAmount(totalAmount.value),
			igvAmount: igvAmount.value.trim() ? parseAmount(igvAmount.value) : null,
		};
		try {
			await mutateAsync({ id: doc.id, patch });
			void triggerHaptic("success");
			onCancel();
		} catch {
			setError("No se pudieron guardar los cambios. Revisa los datos.");
			void triggerHaptic("error");
		}
	}

	return (
		<Sheet onDismiss={onDismiss} snapPoints={["full"]}>
			<FieldGroup>
				<FieldGroup.Section title="Editar comprobante">
					<TextInput value={issuerName} placeholder="Comercio" />
					<TextInput value={issuerTaxId} placeholder="RUC" keyboardType="number-pad" />
					<TextInput value={issueDate} placeholder="DD/MM/AAAA" />
					<Picker selectedValue={documentType} onValueChange={setDocumentType} appearance="menu">
						{DOCUMENT_TYPE_OPTIONS.map((opt) => (
							<Picker.Item key={opt.value} label={opt.label} value={opt.value} />
						))}
					</Picker>
					<TextInput value={documentNumber} placeholder="Número" />
					<TextInput value={totalAmount} placeholder="Monto S/" keyboardType="decimal-pad" />
					<TextInput value={igvAmount} placeholder="IGV (opcional)" keyboardType="decimal-pad" />
				</FieldGroup.Section>
				{error ? (
					<FieldGroup.Section>
						<Text textStyle={{ fontSize: 13, color: "#dc2626" }}>{error}</Text>
					</FieldGroup.Section>
				) : null}
				<FieldGroup.Section>
					<Button
						label={isPending ? "Guardando..." : "Guardar cambios"}
						disabled={isPending}
						onPress={() => void save()}
					/>
					<Button label="Cancelar" variant="text" onPress={onCancel} />
					<DeleteButton id={doc.id} />
				</FieldGroup.Section>
			</FieldGroup>
		</Sheet>
	);
}

function DocHero({ id, icon }: { id?: string; icon: "camera" | "receipt" }) {
	const { data } = useDocumentImage(id ?? "", Boolean(id));
	return (
		<RNHostView matchContents>
			{data?.url ? (
				<Image
					source={{ uri: data.url }}
					contentFit="cover"
					style={{ height: 176, width: "100%", borderRadius: 16, backgroundColor: "#f5f5f5" }}
				/>
			) : (
				<View
					style={{
						height: 176,
						width: "100%",
						borderRadius: 16,
						backgroundColor: "#f5f5f5",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{icon === "camera" ? (
						<Camera color="#c4c4c4" size={32} />
					) : (
						<Receipt color="#c4c4c4" size={36} />
					)}
				</View>
			)}
		</RNHostView>
	);
}

function DeleteButton({ id }: { id: string }) {
	const { mutateAsync, isPending } = useDeleteDocument();
	return (
		<Button
			label="Eliminar comprobante"
			variant="text"
			disabled={isPending}
			onPress={() => {
				Alert.alert("Eliminar comprobante", "Esta acción no se puede deshacer.", [
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Eliminar",
						style: "destructive",
						onPress: () => {
							void triggerHaptic("warning");
							void mutateAsync(id)
								.then(() => router.back())
								.catch(() => Alert.alert("No se pudo eliminar", "Inténtalo de nuevo."));
						},
					},
				]);
			}}
		/>
	);
}

function trimOrNull(value: string): string | null {
	const t = value.trim();
	return t || null;
}

function parseAmount(raw: string): string | null {
	const t = raw
		.trim()
		.replace(",", ".")
		.replace(/[^\d.]/g, "");
	if (!t) return null;
	const n = Number(t);
	return Number.isNaN(n) ? t : n.toFixed(2);
}

function isoToDisplay(iso: string | null | undefined): string {
	if (!iso) return "";
	const [y, m, d] = iso.slice(0, 10).split("-");
	return y && m && d ? `${d}/${m}/${y}` : iso;
}

function displayToIso(raw: string): string | null {
	const t = raw.trim();
	if (!t) return null;
	const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
	if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
	return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : t;
}
