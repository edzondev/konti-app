import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import CameraPermission from "@/components/pages/camera-permission";
import { useEffect, useState } from "react";

export default function CameraPermissionModal() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  useEffect(() => {
    if (hasRequestedPermission && permission?.granted) {
      router.replace("/camera");
    }
  }, [permission?.granted, hasRequestedPermission]);

  const handleRequestPermission = async () => {
    setHasRequestedPermission(true);
    await requestPermission();
  };

  return (
    <CameraPermission
      onRequestPermission={handleRequestPermission}
      canAskAgain={permission?.canAskAgain ?? true}
    />
  );
}
