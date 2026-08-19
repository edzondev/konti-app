import { CameraPermissionGate } from "@/features/documents/components/camera-permission-gate";
import { CaptureCamera } from "@/features/documents/components/capture-camera";

export default function GuardarTabScreen() {
	return (
		<CameraPermissionGate>
			<CaptureCamera />
		</CameraPermissionGate>
	);
}
