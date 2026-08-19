import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { useState } from "react";
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
		if (status === "saving") {
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
		}
	}

	async function handleGallerySelection() {
		if (status === "saving") {
			return;
		}

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

		const capture: PendingCapture = {
			file: {
				uri: asset.uri,
				fileName: asset.fileName,
				mimeType: imageMimeType(asset.uri, asset.mimeType),
			},
			idempotencyKey: randomUUID(),
			source: "gallery",
		};
		setPendingCapture(capture);
		await saveCapture(capture);
	}

	return (
		<View className="flex-1 bg-konti-bg">
			<Camera style={StyleSheet.absoluteFill} device="back" isActive outputs={[photoOutput]} resizeMode="cover" />

			<View className="flex-1 justify-end px-6 pb-32">
				<View className="items-center gap-5">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Elegir de la galería"
						disabled={status === "saving"}
						onPress={() => {
							void handleGallerySelection();
						}}
					>
						<Text className="text-sm font-medium text-konti-ivory">Elegir de la galería</Text>
					</Pressable>

					<ShutterButton disabled={status === "saving"} onPress={handleCameraCapture} />
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

function imageMimeType(uri: string, mimeType: string | undefined): "image/jpeg" | "image/png" | undefined {
	if (mimeType === "image/jpeg" || mimeType === "image/png") {
		return mimeType;
	}

	return uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}
