import { type ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { type Document } from "@/features/comprobantes/comprobantes-document";
import {
	CATEGORY_LABELS,
	DOCUMENT_TYPE_LABELS,
	type DocumentEditDraft,
	type DraftErrors,
} from "@/features/comprobantes/document-form";
import { useDocumentEdit } from "@/features/comprobantes/use-document-edit";
import { ChevronDown } from "@/shared/ui/reicon";

const DOCUMENT_TYPES = ["boleta", "factura", "recibo_honorarios", "ticket"] as const;

function typeLabel(documentType: DocumentEditDraft["documentType"]) {
	return DOCUMENT_TYPE_LABELS[documentType];
}

const FIELD_INPUT = "flex-1 p-0 text-right font-sans text-[15px] leading-5 text-konti-ink";
const FIELD_ROW =
	"min-h-11 flex-row items-center justify-between gap-3 border-b border-konti-border py-3";

function SelectValue({ label, muted, open }: { label: string; muted?: boolean; open: boolean }) {
	return (
		<View className="min-w-0 flex-1 flex-row items-center justify-end gap-1.5">
			<Text
				className={
					muted
						? "shrink text-right font-sans text-[15px] leading-5 text-konti-ink-muted"
						: "shrink text-right font-sans text-[15px] leading-5 text-konti-ink"
				}
				numberOfLines={1}
			>
				{label}
			</Text>
			<ChevronDown
				colorClassName="accent-konti-ink-muted"
				size={14}
				style={open ? { transform: [{ rotate: "180deg" }] } : undefined}
			/>
		</View>
	);
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
			<View className={FIELD_ROW}>
				<Text className="w-28 shrink-0 text-konti-ink-muted">{label}</Text>
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
	categoriesOpen,
	onChange,
	onToggleTypes,
	onPickType,
	onToggleCategories,
	onPickCategory,
	onFocusFooterField,
	onBlurFooterField,
}: {
	draft: DocumentEditDraft;
	fieldErrors: DraftErrors;
	typesOpen: boolean;
	categoriesOpen: boolean;
	onChange: (key: keyof DocumentEditDraft, value: string) => void;
	onToggleTypes: () => void;
	onPickType: (value: DocumentEditDraft["documentType"]) => void;
	onToggleCategories: () => void;
	onPickCategory: (value: Document["category"]) => void;
	onFocusFooterField: () => void;
	onBlurFooterField: () => void;
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
						className={FIELD_INPUT}
					/>
				</FieldRow>
				<FieldRow label="RUC" error={fieldErrors.issuerTaxId}>
					<TextInput
						value={draft.issuerTaxId}
						onChangeText={(value) => onChange("issuerTaxId", value)}
						className={FIELD_INPUT}
					/>
				</FieldRow>
				<FieldRow label="Fecha" error={fieldErrors.issueDate}>
					<TextInput
						value={draft.issueDate}
						onChangeText={(value) => onChange("issueDate", value)}
						placeholder="dd/mm/aaaa"
						className={FIELD_INPUT}
					/>
				</FieldRow>
				<View>
					<Pressable onPress={onToggleTypes} className={FIELD_ROW}>
						<Text className="w-28 shrink-0 text-konti-ink-muted">Tipo</Text>
						<SelectValue
							label={currentType}
							muted={currentType === "Sin completar"}
							open={typesOpen}
						/>
					</Pressable>
					{typesOpen ? (
						<Animated.View
							entering={FadeInDown.duration(180)}
							exiting={FadeOutUp.duration(120)}
							className="border-b border-konti-border"
						>
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
												selected
													? "text-right font-sans text-[15px] leading-5 text-konti-ink"
													: "text-right font-sans text-[15px] leading-5 text-konti-ink-muted"
											}
										>
											{DOCUMENT_TYPE_LABELS[documentType]}
										</Text>
									</Pressable>
								);
							})}
						</Animated.View>
					) : null}
				</View>
				<View>
					<Pressable onPress={onToggleCategories} className={FIELD_ROW}>
						<Text className="w-28 shrink-0 text-konti-ink-muted">Categoría</Text>
						<SelectValue label={CATEGORY_LABELS[draft.category]} open={categoriesOpen} />
					</Pressable>
					{categoriesOpen ? (
						<Animated.View
							entering={FadeInDown.duration(180)}
							exiting={FadeOutUp.duration(120)}
							className="border-b border-konti-border"
						>
							{(Object.keys(CATEGORY_LABELS) as Document["category"][]).map((category) => {
								const selected = draft.category === category;
								return (
									<Pressable
										key={category}
										onPress={() => onPickCategory(category)}
										className="py-3"
									>
										<Text
											className={
												selected
													? "text-right font-sans text-[15px] leading-5 text-konti-ink"
													: "text-right font-sans text-[15px] leading-5 text-konti-ink-muted"
											}
										>
											{CATEGORY_LABELS[category]}
										</Text>
									</Pressable>
								);
							})}
						</Animated.View>
					) : null}
				</View>
				<FieldRow label="Número boleta">
					<TextInput
						value={draft.documentNumber}
						onChangeText={(value) => onChange("documentNumber", value)}
						className={FIELD_INPUT}
					/>
				</FieldRow>
				<FieldRow label="Monto" error={fieldErrors.totalAmount}>
					<TextInput
						value={draft.totalAmount}
						onChangeText={(value) => onChange("totalAmount", value)}
						keyboardType="decimal-pad"
						onFocus={onFocusFooterField}
						onBlur={onBlurFooterField}
						className={FIELD_INPUT}
					/>
				</FieldRow>
				<FieldRow label="IGV" error={fieldErrors.igvAmount}>
					<TextInput
						value={draft.igvAmount}
						onChangeText={(value) => onChange("igvAmount", value)}
						placeholder="Sin completar"
						placeholderTextColorClassName="accent-konti-ink-faint"
						keyboardType="decimal-pad"
						onFocus={onFocusFooterField}
						onBlur={onBlurFooterField}
						className={FIELD_INPUT}
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
	onClose: (updated?: Document) => void;
}) {
	const {
		draft,
		fieldErrors,
		typesOpen,
		categoriesOpen,
		paddingBottom,
		scrollRef,
		isPending,
		isError,
		onChange,
		focusFooterField,
		blurFooterField,
		onToggleTypes,
		onPickType,
		onToggleCategories,
		onPickCategory,
		onLayout,
		onSave,
	} = useDocumentEdit(document, onClose);

	return (
		<View className="flex-1 bg-konti-bg" style={{ paddingBottom }}>
			<ScrollView
				ref={scrollRef}
				className="flex-1"
				contentContainerClassName="px-2 pb-6"
				contentInsetAdjustmentBehavior="automatic"
				keyboardShouldPersistTaps="handled"
				onLayout={onLayout}
			>
				<EditForm
					draft={draft}
					fieldErrors={fieldErrors}
					typesOpen={typesOpen}
					categoriesOpen={categoriesOpen}
					onChange={onChange}
					onFocusFooterField={focusFooterField}
					onBlurFooterField={blurFooterField}
					onToggleTypes={onToggleTypes}
					onPickType={onPickType}
					onToggleCategories={onToggleCategories}
					onPickCategory={onPickCategory}
				/>
			</ScrollView>
			<View className="border-t border-konti-border bg-konti-bg px-5 pb-5 pt-4">
				<Pressable
					disabled={isPending}
					onPress={onSave}
					className={
						isPending
							? "h-14 items-center justify-center rounded-full bg-konti-ink opacity-50"
							: "h-14 items-center justify-center rounded-full bg-konti-ink"
					}
				>
					<Text className="font-sans-medium text-konti-on-ink">Guardar cambios</Text>
				</Pressable>
				{isError ? (
					<Text className="mt-3 text-center text-[12px] text-konti-danger">
						No pudimos guardar los cambios.
					</Text>
				) : null}
				<Pressable onPress={() => onClose()} className="mt-5 py-2">
					<Text className="text-center text-konti-ink-muted">Cancelar</Text>
				</Pressable>
			</View>
		</View>
	);
}
