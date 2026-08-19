import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Camera, usePhotoOutput, type Photo } from "react-native-vision-camera";

import { authClient } from "@/core/auth-client";
import type { LocalImageFile } from "@/features/documents/document-file";
import { useDocumentIntake } from "@/features/documents/use-document-intake";

import { CaptureStatusOverlay } from "./capture-status-overlay";

type CaptureStatus = "idle" | "saving" | "success" | "error";
type IntakeSource = "camera" | "gallery";

type PendingCapture = {
	file: LocalImageFile;
	idempotencyKey: string;
	source: IntakeSource;
};

export function CaptureCamera() {
	const { data: session } = authClient.useSession();
	const documentIntake = useDocumentIntake();
	const photoOutput = usePhotoOutput({ containerFormat: "jpeg", qualityPrioritization: "quality" });
	const [status, setStatus] = useState<CaptureStatus>("idle");
	const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
	const [busy, setBusy] = useState(false);
	const busyRef = useRef(false);

	const controlsDisabled = busy || status === "saving" || status === "success";

	function beginCapture(): boolean {
		if (busyRef.current || status === "saving" || status === "success") {
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
			setStatus("error");
			return;
		}

		setStatus("saving");
		try {
			await documentIntake.mutateAsync({
				...capture.file,
				userId: session.user.id,
				source: capture.source,
				idempotencyKey: capture.idempotencyKey,
			});
			setStatus("success");
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			setStatus("error");
		}
	}

	async function handleCameraCapture() {
		if (!beginCapture()) {
			return;
		}

		const idempotencyKey = randomUUID();
		let photo: Photo | undefined;

		try {
			photo = await photoOutput.capturePhoto({}, {});
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
		} catch {
			setStatus("error");
		} finally {
			photo?.dispose();
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

			if (!isSupportedGalleryMime(asset.mimeType)) {
				setStatus("error");
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
		} catch {
			setStatus("error");
		} finally {
			endCapture();
		}
	}

	return (
		<View className="flex-1 bg-konti-bg">
			<Camera style={StyleSheet.absoluteFill} device="back" isActive outputs={[photoOutput]} resizeMode="cover" />

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

					<ShutterButton disabled={controlsDisabled} onPress={handleCameraCapture} />
				</View>
			</View>

			<CaptureStatusOverlay
				status={status}
				onRetry={() => {
					if (pendingCapture) {
						void saveCapture(pendingCapture);
						return;
					}

					setStatus("idle");
				}}
				onScanAnother={() => {
					setPendingCapture(null);
					setStatus("idle");
				}}
			/>
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
					transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
				}}
			>
				<View className="size-14 rounded-full bg-konti-ivory" />
			</Animated.View>
		</Pressable>
	);
}

function isSupportedGalleryMime(mimeType: string | undefined): mimeType is "image/jpeg" | "image/png" {
	return mimeType === "image/jpeg" || mimeType === "image/png";
}
