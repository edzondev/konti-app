import { useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { launchImageLibraryAsync } from "expo-image-picker";
import { router, useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import {
	type CameraRef,
	type Photo,
	useCameraDevice,
	useCameraPermission,
	usePhotoOutput,
} from "react-native-vision-camera";
import { type Barcode, useBarcodeScannerOutput } from "react-native-vision-camera-barcode-scanner";

import { reportError } from "@/core/report-error";
import { invalidateDocumentMetadata } from "@/features/comprobantes/use-comprobantes";
import { observeQrLatch, type QrHold } from "@/features/scan/scan-stability";
import { uploadDocument } from "@/features/scan/upload-document";

const BARCODE_FORMATS: ["qr-code"] = ["qr-code"];
const SAVED_MS = 2000;

type Phase = "searching" | "detected";

async function lightImpact() {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	} catch {
		// Haptics can be missing on the device.
	}
}

function previewPath(uri: string): string {
	return uri.startsWith("file://") ? uri.slice("file://".length) : uri;
}

/** VisionCamera returns a filesystem path. expo-file-system File requires an absolute URI. */
function fileUri(path: string): string {
	if (path.includes("://")) return path;
	return `file://${path}`;
}

function deleteCameraTemp(file: File | null) {
	if (!file) return;
	try {
		if (file.exists) file.delete();
	} catch (error) {
		reportError("[scan] no se pudo eliminar el archivo temporal", error);
	}
}

export function useScan() {
	const focused = useIsFocused();
	const queryClient = useQueryClient();
	const { hasPermission, requestPermission } = useCameraPermission();
	const device = useCameraDevice("back", {
		physicalDevices: ["wide-angle"],
	});
	const photoOutput = usePhotoOutput({
		containerFormat: "jpeg",
		qualityPrioritization: device?.supportsSpeedQualityPrioritization ? "speed" : "balanced",
	});
	const cameraRef = useRef<CameraRef>(null);
	const holdRef = useRef<QrHold>({ value: null, since: null });
	const latchedRef = useRef<string | null>(null);
	const busyRef = useRef(false);
	const savedPathRef = useRef<string | null>(null);
	const cameraTempRef = useRef<File | null>(null);
	const phaseRef = useRef<Phase>("searching");
	const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const captureQrRef = useRef<(qrPayload: string) => void>(() => {});

	const [phase, setPhase] = useState<Phase>("searching");
	const [savedPath, setSavedPath] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

	useEffect(() => {
		return () => {
			if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
			const cameraTemp = cameraTempRef.current;
			cameraTempRef.current = null;
			deleteCameraTemp(cameraTemp);
		};
	}, []);

	function showSaved(path: string) {
		savedPathRef.current = path;
		setSavedPath(path);
		invalidateDocumentMetadata(queryClient);
		if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
		savedTimerRef.current = setTimeout(() => {
			savedPathRef.current = null;
			setSavedPath(null);
			const cameraTemp = cameraTempRef.current;
			cameraTempRef.current = null;
			deleteCameraTemp(cameraTemp);
			phaseRef.current = "searching";
			setPhase("searching");
		}, SAVED_MS);
	}

	async function captureFromCamera(qrPayload?: string) {
		if (busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		setError(null);
		let photo: Photo | null = null;
		let cameraTemp: File | null = null;
		try {
			await lightImpact();
			photo = await photoOutput.capturePhoto({ flashMode: "off", enableShutterSound: false }, {});
			const filePath = await photo.saveToTemporaryFileAsync();
			const file = new File(fileUri(filePath));
			cameraTemp = file;
			deleteCameraTemp(cameraTempRef.current);
			cameraTempRef.current = file;
			const filename = file.name || "boleta.jpg";
			if (qrPayload) {
				await uploadDocument({ file, filename, source: "camera", qrPayload });
			} else {
				await uploadDocument({ file, filename, source: "camera" });
			}
			showSaved(filePath);
		} catch (error) {
			reportError("[scan] captura", error);
			setError("No se pudo guardar la boleta.");
			if (cameraTempRef.current === cameraTemp) cameraTempRef.current = null;
			deleteCameraTemp(cameraTemp);
		} finally {
			photo?.dispose();
			busyRef.current = false;
			setBusy(false);
		}
	}

	captureQrRef.current = (qrPayload: string) => {
		void captureFromCamera(qrPayload);
	};

	const onBarcodeScanned = useCallback((barcodes: Barcode[]) => {
		const qr = barcodes.find((barcode) => barcode.format === "qr-code");
		const raw = (qr ?? barcodes[0])?.rawValue?.trim() || null;
		const next = observeQrLatch(
			{ hold: holdRef.current, value: latchedRef.current },
			raw,
			Date.now(),
			Boolean(savedPathRef.current || busyRef.current),
		);
		holdRef.current = next.latch.hold;
		latchedRef.current = next.latch.value;

		if (!raw) {
			if (savedPathRef.current || busyRef.current) return;
			if (phaseRef.current !== "searching") {
				phaseRef.current = "searching";
				setPhase("searching");
			}
			return;
		}

		if (!next.stableValue) return;

		if (phaseRef.current !== "detected") {
			phaseRef.current = "detected";
			setPhase("detected");
		}

		if (next.captureValue) captureQrRef.current(next.captureValue);
	}, []);

	const onScanError = useCallback((error: Error) => {
		setError(error.message);
	}, []);

	const barcodeOutput = useBarcodeScannerOutput({
		barcodeFormats: BARCODE_FORMATS,
		onBarcodeScanned,
		onError: onScanError,
	});

	async function pickFromGallery() {
		if (busyRef.current) return;
		busyRef.current = true;
		setError(null);
		try {
			const result = await launchImageLibraryAsync({ mediaTypes: ["images"] });
			if (result.canceled) return;
			const asset = result.assets[0];
			if (!asset) return;
			setBusy(true);
			const file = new File(asset.uri);
			await uploadDocument({
				file,
				filename: asset.fileName ?? (file.name || "boleta.jpg"),
				source: "gallery",
			});
			showSaved(previewPath(asset.uri));
		} catch (error) {
			reportError("[scan] galería", error);
			setError("No se pudo guardar la boleta.");
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	}

	function onRequestPermission() {
		void requestPermission();
	}

	function onTapFocus(event: GestureResponderEvent) {
		const point = {
			x: event.nativeEvent.locationX,
			y: event.nativeEvent.locationY,
		};
		setFocusPoint(point);
		void cameraRef.current
			?.focusTo(point, { responsiveness: "snappy", adaptiveness: "continuous" })
			.catch(() => {});
	}

	function onShutter() {
		void captureFromCamera();
	}

	function onGallery() {
		void pickFromGallery();
	}

	function onClose() {
		router.back();
	}

	return {
		hasPermission,
		requestPermission,
		device,
		cameraRef,
		photoOutput,
		barcodeOutput,
		focused,
		phase,
		savedPath,
		busy,
		error,
		focusPoint,
		onRequestPermission,
		onTapFocus,
		onShutter,
		onGallery,
		onClose,
	};
}
