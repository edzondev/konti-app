import { Linking, Pressable, Text, View } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

type CameraPermissionGateProps = {
	children: React.ReactNode;
};

export function CameraPermissionGate({ children }: CameraPermissionGateProps) {
	const { canRequestPermission, hasPermission, requestPermission } = useCameraPermission();

	if (hasPermission) {
		return children;
	}

	const denied = !canRequestPermission;

	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-7">
			<View className="max-w-[340px] items-center gap-5">
				<Text className="text-center text-[30px] font-semibold leading-[36px] tracking-tight text-konti-ivory">
					Konti necesita tu cámara
				</Text>
				<Text className="text-center text-[15px] leading-[22px] text-konti-ivory/60">
					Para guardar tus comprobantes al momento. Se abre solo cuando tú entras al escáner.
				</Text>

				{denied ? (
					<>
						<Text className="text-center text-sm text-konti-ivory/60">
							Abre Ajustes para permitir la cámara.
						</Text>
						<Pressable
							accessibilityRole="button"
							className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
							onPress={() => {
								void Linking.openSettings();
							}}
						>
							<Text className="text-sm font-semibold text-konti-bg">Abrir Ajustes</Text>
						</Pressable>
					</>
				) : (
					<Pressable
						accessibilityRole="button"
						className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
						onPress={() => {
							void requestPermission();
						}}
					>
						<Text className="text-sm font-semibold text-konti-bg">Permitir cámara</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}
