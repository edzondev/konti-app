import { type ReactNode, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
	KeyboardAwareScrollView,
	KeyboardStickyView,
	KeyboardToolbar,
} from "react-native-keyboard-controller";

import { type Document } from "@/features/comprobantes/comprobantes-document";
import {
	DOCUMENT_TYPE_LABELS,
	type DocumentEditDraft,
	type DraftErrors,
	toEditDraft,
	toUpdatePayload,
	validateDraft,
} from "@/features/comprobantes/document-form";
import { useUpdateDocument } from "@/features/comprobantes/use-comprobantes";

const DOCUMENT_TYPES = ["boleta", "factura", "recibo_honorarios", "ticket"] as const;

function typeLabel(documentType: DocumentEditDraft["documentType"]) {
	return DOCUMENT_TYPE_LABELS[documentType];
}

function FieldRow({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<View>
			<View className="flex-row items-center justify-between gap-3 border-b border-konti-border py-3">
				<Text className="w-24 text-konti-ink-muted">{label}</Text>
				{children}
			</View>
			{error ? <Text className="text-[12px] text-konti-danger">{error}</Text> : null}
		</View>
	);
}

function EditForm({
	draft,
	fieldErrors,
	typesOpen,
	onChange,
	onToggleTypes,
	onPickType,
}: {
	draft: DocumentEditDraft;
	fieldErrors: DraftErrors;
	typesOpen: boolean;
	onChange: (key: keyof DocumentEditDraft, value: string) => void;
	onToggleTypes: () => void;
	onPickType: (value: DocumentEditDraft["documentType"]) => void;
}) {
	const currentType = typeLabel(draft.documentType);

	return (
		<View>
			<View className="flex-row items-center gap-2">
				<View className="h-1.5 w-1.5 rounded-full bg-konti-amber" />
				<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
					EDITAR COMPROBANTE
				</Text>
			</View>
			<Text className="mt-3 font-sans-light text-[32px] text-konti-ink">
				<Text className="text-konti-amber-deep">Completa</Text>
				{" los datos."}
			</Text>
			<Text className="mt-2 text-konti-ink-muted">
				Corrige lo que falte. Konti guarda tus cambios.
			</Text>
			<View className="mt-6">
				<FieldRow label="Comercio">
					<TextInput
						value={draft.issuerName}
						onChangeText={(value) => onChange("issuerName", value)}
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
				<FieldRow label="RUC" error={fieldErrors.issuerTaxId}>
					<TextInput
						value={draft.issuerTaxId}
						onChangeText={(value) => onChange("issuerTaxId", value)}
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
				<FieldRow label="Fecha" error={fieldErrors.issueDate}>
					<TextInput
						value={draft.issueDate}
						onChangeText={(value) => onChange("issueDate", value)}
						placeholder="dd/mm/aaaa"
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
				<View>
					<Pressable
						onPress={onToggleTypes}
						className="flex-row items-center justify-between gap-3 border-b border-konti-border py-3"
					>
						<Text className="w-24 text-konti-ink-muted">Tipo</Text>
						<Text
							className={
								currentType === "Sin completar" ? "text-konti-ink-muted" : "text-konti-ink"
							}
						>
							{currentType}
						</Text>
					</Pressable>
					{typesOpen ? (
						<View className="border-b border-konti-border">
							{DOCUMENT_TYPES.map((documentType) => {
								const selected = draft.documentType === documentType;
								return (
									<Pressable
										key={documentType}
										onPress={() => onPickType(documentType)}
										className="py-3"
									>
										<Text
											className={
												selected ? "text-right text-konti-ink" : "text-right text-konti-ink-muted"
											}
										>
											{DOCUMENT_TYPE_LABELS[documentType]}
										</Text>
									</Pressable>
								);
							})}
						</View>
					) : null}
				</View>
				<FieldRow label="Número">
					<TextInput
						value={draft.documentNumber}
						onChangeText={(value) => onChange("documentNumber", value)}
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
				<FieldRow label="Monto" error={fieldErrors.totalAmount}>
					<TextInput
						value={draft.totalAmount}
						onChangeText={(value) => onChange("totalAmount", value)}
						keyboardType="decimal-pad"
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
				<FieldRow label="IGV" error={fieldErrors.igvAmount}>
					<TextInput
						value={draft.igvAmount}
						onChangeText={(value) => onChange("igvAmount", value)}
						placeholder="Sin completar"
						placeholderTextColorClassName="accent-konti-ink-faint"
						keyboardType="decimal-pad"
						className="flex-1 text-right font-sans text-[15px] text-konti-ink"
					/>
				</FieldRow>
			</View>
		</View>
	);
}

export function DocumentEditScreen({
	document,
	onClose,
}: {
	document: Document;
	onClose: () => void;
}) {
	const update = useUpdateDocument(document.id);
	const [draft, setDraft] = useState(() => toEditDraft(document));
	const [fieldErrors, setFieldErrors] = useState<DraftErrors>({});
	const [typesOpen, setTypesOpen] = useState(false);

	function onChange(key: keyof DocumentEditDraft, value: string) {
		if (update.isError) update.reset();
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function onSave() {
		if (update.isPending) return;
		const errors = validateDraft(draft);
		if (Object.values(errors).some(Boolean)) {
			setFieldErrors(errors);
			return;
		}
		setFieldErrors({});
		const payload = toUpdatePayload(document, draft);
		if (payload === null) {
			onClose();
			return;
		}
		update.mutate(payload, { onSuccess: onClose });
	}

	return (
		<View className="flex-1 bg-konti-bg">
			<KeyboardAwareScrollView
				className="flex-1"
				bottomOffset={24}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="px-2 pb-6"
				extraKeyboardSpace={88}
			>
				<EditForm
					draft={draft}
					fieldErrors={fieldErrors}
					typesOpen={typesOpen}
					onChange={onChange}
					onToggleTypes={() => setTypesOpen((open) => !open)}
					onPickType={(value) => {
						onChange("documentType", value);
						setTypesOpen(false);
					}}
				/>
			</KeyboardAwareScrollView>
			<KeyboardStickyView offset={{ opened: 8 }}>
				<View className="border-t border-konti-border bg-konti-bg px-5 pb-3 pt-3">
					<Pressable
						disabled={update.isPending}
						onPress={onSave}
						className={
							update.isPending
								? "h-14 items-center justify-center rounded-full bg-konti-ink opacity-50"
								: "h-14 items-center justify-center rounded-full bg-konti-ink"
						}
					>
						<Text className="font-sans-medium text-konti-on-ink">Guardar cambios</Text>
					</Pressable>
					{update.isError ? (
						<Text className="mt-3 text-center text-[12px] text-konti-danger">
							No pudimos guardar los cambios.
						</Text>
					) : null}
					<Pressable onPress={onClose}>
						<Text className="mt-3 text-center text-konti-ink-muted">Cancelar</Text>
					</Pressable>
				</View>
			</KeyboardStickyView>
			<KeyboardToolbar>
				<KeyboardToolbar.Done text="Listo" />
			</KeyboardToolbar>
		</View>
	);
}
