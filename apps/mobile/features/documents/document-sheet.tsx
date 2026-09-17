import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { triggerHaptic } from "@/core/haptics";
import type { DocumentListItem, DocumentType, UpdateDocumentInput } from "@/features/documents/document";
import {
	categoryLabel,
	DOCUMENT_TYPE_OPTIONS,
	documentTypeLabel,
	formatIssueDate,
	formatSoles,
	sourceLabel,
} from "@/features/documents/document-ui";
import {
	useDeleteDocument,
	useDocument,
	useDocumentImage,
	useUpdateDocument,
} from "@/features/documents/use-documents";
import { Camera, Check, ChevronRight, Receipt } from "@/shared/ui/reicon";

export function DocumentSheet() {
	const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
	const { data: doc, isPending } = useDocument(id);
	const [editing, setEditing] = useState(edit === "1");

	if (!id) return null;
	if (isPending && !doc) {
		return (
			<SheetBody>
				<ActivityIndicator />
			</SheetBody>
		);
	}
	if (!doc) {
		return (
			<SheetBody>
				<Text className="text-center text-[16px] text-black/60">
					No encontramos este comprobante.
				</Text>
				<Pressable className="mt-4" onPress={() => router.back()}>
					<Text className="text-[15px] font-medium">Cerrar</Text>
				</Pressable>
			</SheetBody>
		);
	}
	if (editing) return <EditForm doc={doc} onCancel={() => setEditing(false)} />;
	if (doc.status === "pending") return <ProcessingState />;
	if (doc.status === "failed") {
		return (
			<FailedState
				doc={doc}
				onEdit={() => {
					void triggerHaptic("selection");
					setEditing(true);
				}}
			/>
		);
	}
	return (
		<ReadyDetail
			doc={doc}
			onEdit={() => {
				void triggerHaptic("selection");
				setEditing(true);
			}}
		/>
	);
}

/** Aire bajo el grabber nativo del formSheet. */
function SheetBody({ children }: { children: ReactNode }) {
	const insets = useSafeAreaInsets();
	return (
		<View
			className="bg-white px-6"
			style={{ paddingTop: 28, paddingBottom: Math.max(insets.bottom, 16) }}
		>
			<StatusBar style="dark" />
			{children}
		</View>
	);
}

function ProcessingState() {
	return (
		<SheetBody>
			<Placeholder icon="receipt" />
			<Text className="mt-6 text-[26px] font-medium tracking-tight text-black">
				Leyendo tu comprobante.
			</Text>
			<Text className="mt-2 pb-4 text-[15px] leading-6 text-black/45">
				Esto suele tomar unos segundos. Puedes cerrar esta pantalla.
			</Text>
		</SheetBody>
	);
}

function FailedState({ doc, onEdit }: { doc: DocumentListItem; onEdit: () => void }) {
	return (
		<SheetBody>
			<ScrollView bounces={false} keyboardShouldPersistTaps="handled">
				<DocImage id={doc.id} fallback="camera" />
				<Eyebrow>Lectura fallida</Eyebrow>
				<Text className="mt-3 text-[28px] font-medium tracking-tight text-black">
					No pudimos <Text className="italic text-orange-700">leerlo</Text>
				</Text>
				<Text className="mt-2 text-[15px] leading-6 text-black/45">
					La foto no es lo bastante clara. Puedes intentar de nuevo o ingresar los datos a mano.
				</Text>
				<Pressable
					className="mt-8 items-center rounded-full bg-black py-4"
					onPress={() => {
						void triggerHaptic("selection");
						router.replace("/guardar");
					}}
				>
					<Text className="text-[16px] font-medium text-white">Reintentar</Text>
				</Pressable>
				<Pressable
					className="mt-3 items-center rounded-full border border-black/10 py-4"
					onPress={onEdit}
				>
					<Text className="text-[16px] font-medium text-black">Ingresar a mano</Text>
				</Pressable>
				<DeleteButton id={doc.id} />
			</ScrollView>
		</SheetBody>
	);
}

function ReadyDetail({ doc, onEdit }: { doc: DocumentListItem; onEdit: () => void }) {
	return (
		<SheetBody>
			<ScrollView bounces={false}>
				<DocImage id={doc.id} fallback="receipt" />
				<Text selectable className="mt-5 text-[28px] font-medium tracking-tight text-black">
					{doc.issuerName ?? "Comprobante"}
				</Text>
				<Text
					selectable
					className="mt-1 text-[32px] font-medium tabular-nums tracking-tight text-black"
				>
					{formatSoles(doc.totalAmount)}
				</Text>
				<View className="mt-6">
					<InfoRow label="Fecha" value={formatIssueDate(doc.issueDate)} />
					<InfoRow label="Categoría" value={categoryLabel(doc.category)} />
					<InfoRow label="RUC" value={doc.issuerTaxId || "—"} />
					<InfoRow label="Tipo" value={documentTypeLabel(doc.documentType)} />
					<InfoRow label="Número" value={doc.documentNumber || "—"} />
					<InfoRow label="Origen" value={sourceLabel(doc.source)} last />
				</View>
				<Pressable
					className="mt-6 items-center rounded-full border border-black/10 py-4"
					onPress={onEdit}
				>
					<Text className="text-[16px] font-medium text-black">Editar información</Text>
				</Pressable>
				<DeleteButton id={doc.id} />
			</ScrollView>
		</SheetBody>
	);
}

function EditForm({ doc, onCancel }: { doc: DocumentListItem; onCancel: () => void }) {
	const update = useUpdateDocument();
	const [typeOpen, setTypeOpen] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState({
		issuerName: doc.issuerName ?? "",
		issuerTaxId: doc.issuerTaxId ?? "",
		issueDate: toDisplayDate(doc.issueDate),
		documentType: (doc.documentType === "unknown" ? "boleta" : doc.documentType) as DocumentType,
		documentNumber: doc.documentNumber ?? "",
		totalAmount: doc.totalAmount ?? "",
		igvAmount: doc.igvAmount ?? "",
	});

	useEffect(() => {
		if (!saved) return;
		const t = setTimeout(onCancel, 700);
		return () => clearTimeout(t);
	}, [saved, onCancel]);

	async function save() {
		setError(null);
		const patch: UpdateDocumentInput = {
			issuerName: emptyToNull(form.issuerName),
			issuerTaxId: emptyToNull(form.issuerTaxId),
			issueDate: parseDateInput(form.issueDate),
			documentType: form.documentType,
			documentNumber: emptyToNull(form.documentNumber),
			totalAmount: normalizeAmount(form.totalAmount),
			igvAmount: form.igvAmount.trim() ? normalizeAmount(form.igvAmount) : null,
		};
		try {
			await update.mutateAsync({ id: doc.id, patch });
			await triggerHaptic("success");
			setSaved(true);
		} catch {
			setError("No se pudieron guardar los cambios. Revisa los datos.");
			await triggerHaptic("error");
		}
	}

	if (saved) {
		return (
			<SheetBody>
				<View className="items-center py-16">
					<Animated.View entering={ZoomIn.springify().damping(16).stiffness(280)}>
						<View className="h-14 w-14 items-center justify-center rounded-full bg-black">
							<Check color="#fff" size={26} />
						</View>
					</Animated.View>
					<Text className="mt-4 text-[18px] font-medium text-black">Guardado</Text>
				</View>
			</SheetBody>
		);
	}

	return (
		<SheetBody>
			<KeyboardAwareScrollView
				bottomOffset={24}
				extraKeyboardSpace={12}
				keyboardShouldPersistTaps="handled"
				mode="insets"
			>
				<Eyebrow>Editar comprobante</Eyebrow>
				<Text className="mt-3 text-[28px] font-medium tracking-tight text-black">
					<Text className="italic text-orange-700">Completa</Text> los datos.
				</Text>
				<Text className="mt-2 text-[15px] text-black/45">
					Corrige lo que falte. Konti guarda tus cambios.
				</Text>

				<View className="mt-6">
					<FieldRow
						label="Comercio"
						value={form.issuerName}
						onChange={(v) => setForm((f) => ({ ...f, issuerName: v }))}
					/>
					<FieldRow
						label="RUC"
						value={form.issuerTaxId}
						keyboardType="number-pad"
						onChange={(v) => setForm((f) => ({ ...f, issuerTaxId: v }))}
					/>
					<FieldRow
						label="Fecha"
						value={form.issueDate}
						placeholder="DD/MM/AAAA"
						onChange={(v) => setForm((f) => ({ ...f, issueDate: v }))}
					/>
					<Pressable
						className="flex-row items-center border-b border-black/10 py-3.5"
						onPress={() => setTypeOpen((o) => !o)}
					>
						<Text className="flex-1 text-[15px] text-black/45">Tipo</Text>
						<Text className="mr-1 text-[15px] font-medium text-black">
							{documentTypeLabel(form.documentType)}
						</Text>
						<ChevronRight color="#111" size={16} />
					</Pressable>
					{typeOpen
						? DOCUMENT_TYPE_OPTIONS.map((opt) => (
								<Pressable
									key={opt.value}
									className="py-3"
									onPress={() => {
										setForm((f) => ({ ...f, documentType: opt.value }));
										setTypeOpen(false);
									}}
								>
									<Text
										className={`text-right text-[15px] ${
											form.documentType === opt.value ? "font-medium text-black" : "text-black/50"
										}`}
									>
										{opt.label}
									</Text>
								</Pressable>
							))
						: null}
					<FieldRow
						label="Número"
						value={form.documentNumber}
						onChange={(v) => setForm((f) => ({ ...f, documentNumber: v }))}
					/>
					<FieldRow
						label="Monto"
						value={form.totalAmount}
						keyboardType="decimal-pad"
						prefix="S/"
						onChange={(v) => setForm((f) => ({ ...f, totalAmount: v }))}
					/>
					<FieldRow
						label="IGV"
						value={form.igvAmount}
						keyboardType="decimal-pad"
						placeholder="Sin completar"
						onChange={(v) => setForm((f) => ({ ...f, igvAmount: v }))}
						last
					/>
				</View>

				{error ? <Text className="mt-4 text-[13px] text-red-600">{error}</Text> : null}

				<Pressable
					className="mt-8 items-center rounded-full bg-black py-4"
					disabled={update.isPending}
					onPress={() => void save()}
				>
					<Text className="text-[16px] font-medium text-white">
						{update.isPending ? "Guardando..." : "Guardar cambios"}
					</Text>
				</Pressable>
				<Pressable className="mt-2 items-center py-3" onPress={onCancel}>
					<Text className="text-[15px] text-black/45">Cancelar</Text>
				</Pressable>
			</KeyboardAwareScrollView>
		</SheetBody>
	);
}

function Eyebrow({ children }: { children: string }) {
	return (
		<View className="flex-row items-center gap-2">
			<View className="h-1.5 w-1.5 rounded-full bg-orange-400" />
			<Text className="text-[11px] font-medium uppercase tracking-widest text-black/40">
				{children}
			</Text>
		</View>
	);
}

function FieldRow({
	label,
	value,
	onChange,
	placeholder,
	keyboardType,
	prefix,
	last,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	keyboardType?: "number-pad" | "decimal-pad";
	prefix?: string;
	last?: boolean;
}) {
	return (
		<View className={`flex-row items-center py-3.5 ${last ? "" : "border-b border-black/10"}`}>
			<Text className="w-[110px] text-[15px] text-black/45">{label}</Text>
			{prefix ? <Text className="mr-1 text-[15px] font-medium text-black">{prefix}</Text> : null}
			<TextInput
				className="flex-1 text-right text-[15px] font-medium text-black"
				value={value}
				onChangeText={onChange}
				placeholder={placeholder}
				placeholderTextColor="#b0b0b0"
				keyboardType={keyboardType}
				autoCapitalize="none"
			/>
			<ChevronRight color="#bbb" size={16} />
		</View>
	);
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
	return (
		<View
			className={`flex-row items-center justify-between py-3.5 ${last ? "" : "border-b border-black/10"}`}
		>
			<Text className="text-[15px] text-black/45">{label}</Text>
			<Text selectable className="text-[15px] font-medium text-black">
				{value}
			</Text>
		</View>
	);
}

function DocImage({ id, fallback }: { id: string; fallback: "camera" | "receipt" }) {
	const { data } = useDocumentImage(id, true);
	if (data?.url) {
		return (
			<Image
				source={{ uri: data.url }}
				contentFit="cover"
				className="h-44 w-full rounded-2xl bg-black/5"
			/>
		);
	}
	return <Placeholder icon={fallback} />;
}

function Placeholder({ icon }: { icon: "camera" | "receipt" }) {
	return (
		<View className="h-44 w-full items-center justify-center rounded-2xl bg-black/5">
			{icon === "camera" ? <Camera color="#c4c4c4" size={32} /> : <Receipt color="#c4c4c4" size={36} />}
		</View>
	);
}

function DeleteButton({ id }: { id: string }) {
	const remove = useDeleteDocument();
	return (
		<Pressable
			className="mt-4 items-center py-3"
			disabled={remove.isPending}
			onPress={() => {
				Alert.alert("Eliminar comprobante", "Esta acción no se puede deshacer.", [
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Eliminar",
						style: "destructive",
						onPress: () => {
							void triggerHaptic("warning");
							void remove
								.mutateAsync(id)
								.then(() => router.back())
								.catch(() => Alert.alert("No se pudo eliminar", "Inténtalo de nuevo."));
						},
					},
				]);
			}}
		>
			<Text className="text-[15px] text-red-600">Eliminar comprobante</Text>
		</Pressable>
	);
}

function emptyToNull(value: string): string | null {
	const t = value.trim();
	return t || null;
}

function normalizeAmount(raw: string): string | null {
	const t = raw.trim().replace(",", ".").replace(/[^\d.]/g, "");
	if (!t) return null;
	const n = Number(t);
	return Number.isNaN(n) ? t : n.toFixed(2);
}

function toDisplayDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const [y, m, d] = iso.slice(0, 10).split("-");
	return y && m && d ? `${d}/${m}/${y}` : iso;
}

function parseDateInput(raw: string): string | null {
	const t = raw.trim();
	if (!t) return null;
	const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
	if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
	return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : t;
}
