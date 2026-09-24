import { BottomSheet, RNHostView } from "@expo/ui";
import { useState } from "react";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import { useDeleteAccountSheetState } from "@/features/profile/use-delete-account";

const CONFIRM_WORD = "ELIMINAR";

export function DeleteAccountSheet() {
	const { isPresented, dismiss, confirmDelete } = useDeleteAccountSheetState();
	const [text, setText] = useState("");
	const [busy, setBusy] = useState(false);
	const { height, width } = useWindowDimensions();
	const sheetBackground = useResolveClassNames("bg-konti-bg");
	const canConfirm = text === CONFIRM_WORD && !busy;

	function onDismiss() {
		if (busy) return;
		setText("");
		dismiss();
	}

	async function onConfirm() {
		if (!canConfirm) return;
		setBusy(true);
		try {
			await confirmDelete();
			setText("");
		} finally {
			setBusy(false);
		}
	}

	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["half"]}
			contentPadding={0}
			containerColor={sheetBackground.backgroundColor}
		>
			{isPresented ? (
				<RNHostView style={{ height: height * 0.5, width }}>
					<View className="flex-1 bg-konti-bg px-6 pb-8 pt-2">
						<Text className="font-sans-light text-[28px] tracking-tight text-konti-ink">
							Eliminar <Text className="italic text-konti-danger">cuenta</Text>
						</Text>
						<Text className="mt-3 text-[15px] leading-6 text-konti-ink-muted">
							Se borrarán tus datos de forma permanente. Escribe {CONFIRM_WORD} para confirmar.
						</Text>
						<TextInput
							accessibilityLabel={`Escribe ${CONFIRM_WORD} para confirmar`}
							autoCapitalize="characters"
							autoCorrect={false}
							className="mt-6 rounded-2xl border border-konti-border bg-konti-fill px-4 py-3 font-sans-medium text-[16px] text-konti-ink"
							onChangeText={setText}
							placeholder={CONFIRM_WORD}
							placeholderTextColor="#9CA3AF"
							value={text}
						/>
						<Pressable
							accessibilityLabel="Confirmar eliminación"
							accessibilityRole="button"
							accessibilityState={{ disabled: !canConfirm }}
							className={
								canConfirm
									? "mt-6 h-14 items-center justify-center rounded-full bg-konti-danger"
									: "mt-6 h-14 items-center justify-center rounded-full bg-konti-fill"
							}
							disabled={!canConfirm}
							onPress={() => {
								void onConfirm();
							}}
						>
							<Text
								className={
									canConfirm
										? "font-sans-medium text-base text-konti-on-ink"
										: "font-sans-medium text-base text-konti-ink-disabled"
								}
							>
								{busy ? "Eliminando…" : "Eliminar cuenta"}
							</Text>
						</Pressable>
						<Pressable
							accessibilityLabel="Cancelar"
							accessibilityRole="button"
							className="mt-3 h-12 items-center justify-center"
							disabled={busy}
							onPress={onDismiss}
						>
							<Text className="font-sans-medium text-[15px] text-konti-ink-muted">Cancelar</Text>
						</Pressable>
					</View>
				</RNHostView>
			) : null}
		</BottomSheet>
	);
}
