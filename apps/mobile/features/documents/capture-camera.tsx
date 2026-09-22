import { launchImageLibraryAsync } from "expo-image-picker";
import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Modal, Pressable, Text, View } from "react-native";
import { loadImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, useCameraPermission, usePhotoOutput } from "react-native-vision-camera";
import {
	createBarcodeScanner,
	useBarcodeScannerOutput,
} from "react-native-vision-camera-barcode-scanner";

import { ApiError } from "@/core/api-fetch";
import { triggerHaptic } from "@/core/haptics";
import { useCreateDocument } from "@/features/documents/use-documents";
import { Check, Image as ImageIcon, X } from "@/shared/ui/reicon";

const QR_FORMATS: ["qr-code"] = ["qr-code"];

function uploadErrorMessage(error: unknown) {
	if (error instanceof ApiError && error.status === 429) {
		return "Límite alcanzado. Espera un momento.";
	}
	return "No se pudo guardar.";
}

function logFail(step: string, error: unknown) {
	if (error instanceof ApiError) {
		console.warn(`[konti] ${step} ${error.status}`, error.message);
		return;
	}
	console.warn(`[konti] ${step}`, error instanceof Error ? error.message : error);
}

async function qrFromImageUri(uri: string): Promise<string | undefined> {
	try {
		const scanner = createBarcodeScanner({ barcodeFormats: QR_FORMATS });
		const image = await Promise.resolve(loadImage({ filePath: uri }));
		try {
			const codes = await scanner.scanCodesInImageAsync(image);
			return codes[0]?.rawValue;
		} finally {
			image.dispose();
			scanner.dispose();
		}
	} catch {
		return undefined;
	}
}

function CloseButton({ top, onPress }: { top: number; onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Cerrar"
			hitSlop={12}
			className="absolute left-4 z-20 h-11 w-11 items-center justify-center"
			style={{ top }}
			onPress={onPress}
		>
			<X color="#fff" size={22} />
		</Pressable>
	);
}

function StatusChip({ detected }: { detected: boolean }) {
	return (
		<View className="flex-row items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5">
			<View className={`h-1.5 w-1.5 rounded-full ${detected ? "bg-orange-400" : "bg-white"}`} />
			<Text className="text-[13px] text-white">
				{detected ? "QR detectado" : "Buscando comprobante"}
			</Text>
		</View>
	);
}

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_POS: Record<Corner, string> = {
	tl: "top-0 left-0",
	tr: "top-0 right-0",
	bl: "bottom-0 left-0",
	br: "bottom-0 right-0",
};

const CORNER_L: Record<Corner, string> = {
	tl: "border-t-2 border-l-2",
	tr: "border-t-2 border-r-2",
	bl: "border-b-2 border-l-2",
	br: "border-b-2 border-r-2",
};

function FrameCorner({ corner, filled }: { corner: Corner; filled: boolean }) {
	if (filled) {
		return (
			<View
				className={`absolute h-3.5 w-3.5 bg-white ${CORNER_POS[corner]}`}
				style={{
					borderRadius: 2,
					borderCurve: "continuous",
					boxShadow: "0 0 10px rgba(255,255,255,0.6)",
				}}
			/>
		);
	}

	return (
		<View
			className={`absolute h-8 w-8 ${CORNER_POS[corner]} ${CORNER_L[corner]} border-orange-400`}
		/>
	);
}

function DocumentFrame({ filled }: { filled: boolean }) {
	return (
		<View className="absolute inset-0 items-center justify-center" pointerEvents="none">
			<View className="aspect-[3/4] w-[68%]">
				<FrameCorner corner="tl" filled={filled} />
				<FrameCorner corner="tr" filled={filled} />
				<FrameCorner corner="bl" filled={filled} />
				<FrameCorner corner="br" filled={filled} />
			</View>
		</View>
	);
}

function GalleryButton({ onPress }: { onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Elegir de galería"
			className="h-14 w-14 items-center justify-center rounded-full bg-white/15"
			onPress={onPress}
		>
			<ImageIcon color="#fff" size={22} />
		</Pressable>
	);
}

function ShutterButton({ onPress }: { onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Tomar foto"
			className="h-20 w-20 rounded-full bg-white"
			onPress={onPress}
		/>
	);
}

function SavedSheet({
	visible,
	bottomInset,
	onClose,
}: {
	visible: boolean;
	bottomInset: number;
	onClose: () => void;
}) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end bg-black/40">
				<Pressable className="absolute inset-0" onPress={onClose} />
				<View
					className="w-full items-center rounded-t-3xl bg-white px-5 pt-0"
					style={{ paddingBottom: bottomInset }}
				>
					<View className="items-center pb-5 pt-4">
						<View className="h-1 w-10 rounded-full bg-black/20" />
					</View>
					<View className="gap-3 pb-6 items-center">
						<View className="h-14 w-14 items-center justify-center rounded-full bg-orange-400">
							<Check color="#fff" size={24} />
						</View>
						<Text className="text-[22px] font-medium text-black">Guardado.</Text>
						<Text className="text-[15px] text-black/45">Te avisamos cuando esté listo.</Text>
					</View>
				</View>
			</View>
		</Modal>
	);
}

function PermissionBody({
	canRequest,
	onRequest,
	onClose,
	top,
}: {
	canRequest: boolean;
	onRequest: () => void;
	onClose: () => void;
	top: number;
}) {
	return (
		<View className="flex-1 bg-black">
			<StatusBar style="light" />
			<CloseButton top={top} onPress={onClose} />
			<View className="flex-1 items-center justify-center px-8">
				{canRequest ? (
					<Pressable
						accessibilityRole="button"
						className="rounded-full bg-white px-5 py-3"
						onPress={onRequest}
					>
						<Text className="text-[16px] font-medium text-black">Permitir cámara</Text>
					</Pressable>
				) : (
					<Text className="text-center text-[15px] text-white/80">
						Activa la cámara en Ajustes para escanear comprobantes.
					</Text>
				)}
			</View>
		</View>
	);
}

export function CaptureCamera() {
	const { push } = useRouter();
	const isFocused = useIsFocused();
	const insets = useSafeAreaInsets();
	const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();
	const { mutateAsync, isPending } = useCreateDocument();
	const photoOutput = usePhotoOutput({ containerFormat: "jpeg" });

	const [appActive, setAppActive] = useState(() => AppState.currentState === "active");
	const [qrDetected, setQrDetected] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const scanLockRef = useRef(false);
	const busyRef = useRef(false);
	const qrPayloadRef = useRef<string | undefined>(undefined);
	const photoOutputRef = useRef(photoOutput);
	photoOutputRef.current = photoOutput;

	useEffect(() => {
		const sub = AppState.addEventListener("change", (status) => {
			setAppActive(status === "active");
		});
		return () => sub.remove();
	}, []);

	const barcodeOutput = useBarcodeScannerOutput({
		barcodeFormats: QR_FORMATS,
		onBarcodeScanned(barcodes) {
			const qrPayload = barcodes[0]?.rawValue;
			if (!qrPayload || scanLockRef.current || busyRef.current) return;
			scanLockRef.current = true;
			qrPayloadRef.current = qrPayload;
			setQrDetected(true);
			void triggerHaptic("selection");
			void captureAndUpload("camera", qrPayload);
		},
		onError() {},
	});

	const outputs = useMemo(() => [photoOutput, barcodeOutput], [photoOutput, barcodeOutput]);

	const isActive = isFocused && appActive && !saved;
	const detected = qrDetected && !saved;
	const topPad = insets.top + 8;
	const bottomPad = Math.max(insets.bottom, 16) + 8;

	function goComprobantes() {
		push("/comprobantes");
	}

	function resetScan() {
		scanLockRef.current = false;
		busyRef.current = false;
		qrPayloadRef.current = undefined;
		setQrDetected(false);
		setSaved(false);
		setError(null);
	}

	async function upload(
		source: "camera" | "gallery",
		uri: string,
		qrPayload?: string,
		mimeType = "image/jpeg",
	) {
		try {
			setError(null);
			console.warn("[konti] upload", source, mimeType);
			await mutateAsync({ source, uri, mimeType, qrPayload });
			void triggerHaptic("success");
			setSaved(true);
		} catch (err) {
			logFail("upload", err);
			busyRef.current = false;
			scanLockRef.current = false;
			setError(uploadErrorMessage(err));
			void triggerHaptic("error");
		}
	}

	async function captureAndUpload(source: "camera", qrPayload?: string) {
		if (busyRef.current) return;
		busyRef.current = true;
		try {
			const { filePath } = await photoOutputRef.current.capturePhotoToFile(
				{ flashMode: "off" },
				{},
			);
			console.warn("[konti] photo", filePath);
			await upload(source, filePath, qrPayload);
		} catch (err) {
			logFail("photo", err);
			busyRef.current = false;
			scanLockRef.current = false;
			setError(uploadErrorMessage(err));
			void triggerHaptic("error");
		}
	}

	async function onShutter() {
		if (busyRef.current || isPending || saved) return;
		scanLockRef.current = true;
		void triggerHaptic("selection");
		void captureAndUpload("camera", qrPayloadRef.current);
	}

	async function onGallery() {
		if (busyRef.current || isPending || saved) return;
		busyRef.current = true;
		scanLockRef.current = true;
		void triggerHaptic("selection");
		try {
			const result = await launchImageLibraryAsync({ mediaTypes: "images", quality: 0.9 });
			if (result.canceled || !result.assets[0]) {
				busyRef.current = false;
				scanLockRef.current = qrDetected;
				return;
			}
			const asset = result.assets[0];
			const qrPayload = (await qrFromImageUri(asset.uri)) ?? qrPayloadRef.current;
			if (qrPayload) {
				qrPayloadRef.current = qrPayload;
				setQrDetected(true);
			}
			await upload("gallery", asset.uri, qrPayload, asset.mimeType ?? "image/jpeg");
		} catch (err) {
			busyRef.current = false;
			scanLockRef.current = false;
			setError(uploadErrorMessage(err));
			void triggerHaptic("error");
		}
	}

	if (!hasPermission) {
		return (
			<PermissionBody
				canRequest={canRequestPermission}
				onRequest={() => void requestPermission()}
				onClose={goComprobantes}
				top={topPad}
			/>
		);
	}

	return (
		<View className="flex-1 bg-black">
			<StatusBar style="light" />
			<Camera style={{ flex: 1 }} isActive={isActive} device="back" outputs={outputs} />
			<CloseButton top={topPad} onPress={goComprobantes} />
			<View
				className="absolute inset-x-0 z-10 items-center"
				pointerEvents="none"
				style={{ top: topPad }}
			>
				<StatusChip detected={detected} />
			</View>
			<DocumentFrame filled={detected} />
			{saved ? <View className="absolute inset-0 bg-black/60" pointerEvents="none" /> : null}
			{error ? (
				<Text
					className="absolute inset-x-8 text-center text-[13px] text-white"
					style={{ bottom: bottomPad + 108 }}
				>
					{error}
				</Text>
			) : null}
			<View
				className="absolute inset-x-0 z-10 flex-row items-center justify-center"
				style={{ bottom: bottomPad }}
			>
				<View className="flex-row items-center">
					<GalleryButton onPress={() => void onGallery()} />
					<View className="w-8" />
					<ShutterButton onPress={() => void onShutter()} />
					<View className="w-8" />
					<View className="h-14 w-14" />
				</View>
			</View>
			<SavedSheet visible={saved} bottomInset={bottomPad} onClose={resetScan} />
		</View>
	);
}
