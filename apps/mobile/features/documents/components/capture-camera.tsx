import { BottomSheet, Button, Column, Text as SheetText } from "@expo/ui";
import { environment } from "@expo/ui/swift-ui/modifiers";
import { randomUUID } from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { Camera, type Photo, useCameraDevice, usePhotoOutput } from "react-native-vision-camera";

import { authClient } from "@/core/auth-client";
import { createDevLogger } from "@/core/dev-logger";
import { isSupportedImageMime, type LocalImageFile } from "@/features/documents/document-file";
import { useDocumentIntake } from "@/features/documents/use-document-intake";

const log = createDevLogger("capture-camera");

const SHEET_MODIFIERS = [environment({ key: "colorScheme", value: "dark" })];

type CaptureStatus = "idle" | "saving" | "success" | "error";
type IntakeSource = "camera" | "gallery";

type PendingCapture = {
	file: LocalImageFile;
	idempotencyKey: string;
	source: IntakeSource;
};

export function CaptureCamera() {
	const isFocused = useIsFocused();
	const { data: session } = authClient.useSession();
	const documentIntake = useDocumentIntake();
	const device = useCameraDevice("back");
	const photoOutput = usePhotoOutput({ containerFormat: "jpeg", qualityPrioritization: "quality" });
	const [status, setStatus] = useState<CaptureStatus>("idle");
	const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
	const [busy, setBusy] = useState(false);
	const busyRef = useRef(false);
	const statusRef = useRef<CaptureStatus>("idle");
	const photoRef = useRef<Photo | null>(null);

	function setCaptureStatus(next: CaptureStatus) {
		// Keep ref in sync immediately so BottomSheet onDismiss (which can fire
		// in the same turn as a status change) does not clobber retry/save.
		statusRef.current = next;
		setStatus(next);
	}

	function releasePhoto() {
		photoRef.current?.dispose();
		photoRef.current = null;
	}

	const controlsDisabled =
		!isFocused || busy || status === "saving" || status === "success" || !device;

	function beginCapture(): boolean {
		if (busyRef.current || statusRef.current === "saving" || statusRef.current === "success") {
			return false;
		}

		busyRef.current = true;
		setBusy(true);
		return true;
	}

	function endCapture() {
		busyRef.current = false;
		setBusy(false);
	}

	async function saveCapture(capture: PendingCapture) {
		if (!session?.user.id) {
			log.error("saveCapture: no active session");
			setCaptureStatus("error");
			return;
		}

		setCaptureStatus("saving");
		try {
			await documentIntake.mutateAsync({
				...capture.file,
				source: capture.source,
				idempotencyKey: capture.idempotencyKey,
			});
			setCaptureStatus("success");
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch (error) {
			log.error("saveCapture failed", error);
			setCaptureStatus("error");
		}
	}

	async function handleCameraCapture() {
		if (!beginCapture()) {
			return;
		}

		releasePhoto();
		const idempotencyKey = randomUUID();

		try {
			const photo = await photoOutput.capturePhoto({}, {});
			photoRef.current = photo;
			const path = await photo.saveToTemporaryFileAsync();
			const capture: PendingCapture = {
				file: {
					uri: path.startsWith("file://") ? path : `file://${path}`,
					fileName: `comprobante-${idempotencyKey}.jpg`,
					mimeType: "image/jpeg",
				},
				idempotencyKey,
				source: "camera",
			};
			setPendingCapture(capture);
			await saveCapture(capture);
			if (statusRef.current === "success") {
				releasePhoto();
			}
		} catch (error) {
			log.error("handleCameraCapture failed", error);
			setCaptureStatus("error");
		} finally {
			endCapture();
		}
	}

	async function handleGallerySelection() {
		if (!beginCapture()) {
			return;
		}

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				quality: 1,
			});

			if (result.canceled) {
				return;
			}

			const asset = result.assets[0];
			if (!asset) {
				return;
			}

			if (!isSupportedImageMime(asset.mimeType)) {
				log.error("unsupported mime type", asset.mimeType);
				setCaptureStatus("error");
				return;
			}

			const capture: PendingCapture = {
				file: {
					uri: asset.uri,
					fileName: asset.fileName,
					mimeType: asset.mimeType,
				},
				idempotencyKey: randomUUID(),
				source: "gallery",
			};
			setPendingCapture(capture);
			await saveCapture(capture);
		} catch (error) {
			log.error("handleGallerySelection failed", error);
			setCaptureStatus("error");
		} finally {
			endCapture();
		}
	}

	function handleScanAnother() {
		releasePhoto();
		setPendingCapture(null);
		setCaptureStatus("idle");
	}

	function handleRetry() {
		if (pendingCapture) {
			void saveCapture(pendingCapture);
			return;
		}

		setCaptureStatus("idle");
	}

	function handleSheetDismiss() {
		const current = statusRef.current;
		if (current === "success") {
			releasePhoto();
			setPendingCapture(null);
			setCaptureStatus("idle");
			return;
		}

		if (current === "error") {
			setCaptureStatus("idle");
		}
	}

	return (
		<View className="flex-1 bg-konti-bg" pointerEvents={isFocused ? "auto" : "none"}>
			{device ? (
				<Camera
					style={StyleSheet.absoluteFill}
					device={device}
					isActive={isFocused}
					outputs={[photoOutput]}
					resizeMode="cover"
				/>
			) : (
				<View style={StyleSheet.absoluteFill} className="items-center justify-center px-7">
					<Text className="text-center text-[15px] text-konti-ivory/60">
						No hay cámara disponible en este dispositivo.
					</Text>
				</View>
			)}

			<View className="flex-1 justify-end px-6 pb-32">
				<View className="items-center gap-5">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Elegir de la galería"
						disabled={controlsDisabled}
						onPress={() => {
							void handleGallerySelection();
						}}
					>
						<Text className="text-sm font-medium text-konti-ivory">Elegir de la galería</Text>
					</Pressable>

					<ShutterButton
						disabled={controlsDisabled}
						onPress={() => {
							void handleCameraCapture();
						}}
					/>
				</View>
			</View>

			{status === "saving" ? (
				<Animated.View
					entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)}
					exiting={FadeOut.duration(160).reduceMotion(ReduceMotion.System)}
					style={StyleSheet.absoluteFill}
					className="items-center justify-center bg-konti-bg/75"
				>
					<ActivityIndicator size="large" color="#F5F1E8" />
					<Text className="mt-3 text-sm font-medium text-konti-ivory">Guardando…</Text>
				</Animated.View>
			) : null}

			<BottomSheet
				isPresented={status === "success" || status === "error"}
				onDismiss={handleSheetDismiss}
				modifiers={SHEET_MODIFIERS}
			>
				<Column alignment="center" spacing={16} style={{ padding: 24 }}>
					{status === "success" ? (
						<>
							<SheetText textStyle={{ fontSize: 22, fontWeight: "600" }}>Guardado</SheetText>
							<Button label="Escanear otro" onPress={handleScanAnother} />
						</>
					) : null}
					{status === "error" ? (
						<>
							<SheetText textStyle={{ textAlign: "center" }}>
								No se pudo guardar. Inténtalo de nuevo.
							</SheetText>
							<Button label="Reintentar" onPress={handleRetry} />
						</>
					) : null}
				</Column>
			</BottomSheet>
		</View>
	);
}

function ShutterButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
	const [pressed, setPressed] = useState(false);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Tomar foto"
			disabled={disabled}
			hitSlop={12}
			pressRetentionOffset={16}
			onPress={onPress}
			onPressIn={() => {
				setPressed(true);
			}}
			onPressOut={() => {
				setPressed(false);
			}}
		>
			<Animated.View
				className="size-18 items-center justify-center rounded-full border-4 border-konti-ivory"
				style={{
					transform: [{ scale: pressed ? 0.97 : 1 }],
					transitionProperty: "transform",
					transitionDuration: "120ms",
					transitionTimingFunction: "linear",
				}}
			>
				<View className="size-14 rounded-full bg-konti-ivory" />
			</Animated.View>
		</Pressable>
	);
}
