import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "react-native-vision-camera";

import { ScanOverlay } from "@/features/scan/scan-overlay";
import { useScan } from "@/features/scan/use-scan";
import { Camera as CameraIcon } from "@/shared/ui/reicon";

function CameraGate({
	canRequestPermission,
	onClose,
	onRequest,
}: {
	canRequestPermission: boolean;
	onClose: () => void;
	onRequest: () => void;
}) {
	const insets = useSafeAreaInsets();

	function onAllow() {
		if (canRequestPermission) {
			onRequest();
			return;
		}
		void Linking.openSettings();
	}

	return (
		<View
			className="flex-1 bg-konti-bg px-7"
			style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
		>
			<View className="flex-row items-center gap-2">
				<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
				<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
					PERMISO DE CÁMARA
				</Text>
			</View>

			<View className="mt-16">
				<CameraIcon colorClassName="accent-konti-ink" size={28} />
				<Text className="mt-6 font-sans-light text-[32px] tracking-tight text-konti-ink">
					Para <Text className="italic text-konti-amber">escanear</Text> tus comprobantes
				</Text>
				<Text className="mt-3 text-[15px] leading-6 text-konti-ink-muted">
					Necesitamos acceso a la cámara para leer tus boletas. También puedes importar desde tu
					galería.
				</Text>
			</View>

			<View className="flex-1" />

			<Pressable
				accessibilityRole="button"
				className="h-14 w-full items-center justify-center rounded-full bg-konti-ink"
				onPress={onAllow}
			>
				<Text className="font-sans-medium text-base text-konti-on-ink">Permitir cámara</Text>
			</Pressable>
			<Pressable accessibilityRole="button" className="mt-3 items-center py-3" onPress={onClose}>
				<Text className="text-[15px] text-konti-ink-muted">Ahora no</Text>
			</Pressable>
		</View>
	);
}

export function ScanScreen() {
	const {
		hasPermission,
		device,
		cameraRef,
		photoOutput,
		barcodeOutput,
		focused,
		qrText,
		savedPath,
		busy,
		error,
		focusPoint,
		flashEnabled,
		showFlash,
		torchMode,
		onToggleFlash,
		canRequestPermission,
		onRequestPermission,
		onTapFocus,
		onShutter,
		onGallery,
		onClose,
	} = useScan();

	if (!hasPermission) {
		return (
			<CameraGate
				canRequestPermission={canRequestPermission}
				onClose={onClose}
				onRequest={onRequestPermission}
			/>
		);
	}

	if (!device) {
		return <View className="flex-1 bg-konti-camera-bg" />;
	}

	return (
		<View className="flex-1 bg-konti-camera-bg">
			<Camera
				ref={cameraRef}
				isActive={focused && hasPermission}
				device={device}
				outputs={[photoOutput, barcodeOutput]}
				style={StyleSheet.absoluteFill}
				orientationSource="device"
				torchMode={torchMode}
				implementationMode="compatible"
				pointerEvents="none"
				zoom={Math.min(Math.max(device.minZoom, 1), device.maxZoom)}
			/>
			<View className="absolute inset-0" pointerEvents="box-none">
				<Pressable accessible={false} className="absolute inset-0" onPress={onTapFocus} />
			</View>
			<ScanOverlay
				qrText={qrText}
				savedPath={savedPath}
				busy={busy}
				error={error}
				focusPoint={focusPoint}
				onClose={onClose}
				onShutter={onShutter}
				onGallery={onGallery}
				showFlash={showFlash}
				flashEnabled={flashEnabled}
				onToggleFlash={onToggleFlash}
			/>
		</View>
	);
}
