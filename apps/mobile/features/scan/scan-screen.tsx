import { Pressable, StyleSheet, Text, View } from "react-native";
import { Camera } from "react-native-vision-camera";

import { ScanOverlay } from "@/features/scan/scan-overlay";
import { useScan } from "@/features/scan/use-scan";

function CameraGate({ onRequest }: { onRequest: () => void }) {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-8">
			<Text className="text-center font-sans text-[15px] leading-6 text-konti-ink">
				Se necesita la cámara para escanear.
			</Text>
			<Pressable
				accessibilityRole="button"
				className="mt-6 h-14 items-center justify-center rounded-full bg-konti-ink px-8"
				onPress={onRequest}
			>
				<Text className="font-sans-medium text-base text-konti-on-ink">Permitir cámara</Text>
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
	} = useScan();

	if (!hasPermission) {
		return <CameraGate onRequest={onRequestPermission} />;
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
				enableNativeTapToFocusGesture
				style={StyleSheet.absoluteFill}
				orientationSource="device"
			/>
			<View className="absolute inset-0" pointerEvents="box-none">
				<Pressable accessible={false} className="absolute inset-0" onPress={onTapFocus} />
			</View>
			<ScanOverlay
				phase={phase}
				savedPath={savedPath}
				busy={busy}
				error={error}
				focusPoint={focusPoint}
				onClose={onClose}
				onShutter={onShutter}
				onGallery={onGallery}
			/>
		</View>
	);
}
