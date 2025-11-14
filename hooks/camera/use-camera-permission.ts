import { useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export function useCameraPermission() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPress = useCallback(async () => {
    if (permission?.granted) {
      router.push('/camera');
      return;
    }

    const result = await requestPermission();
    if (result.granted) {
      router.push('/camera');
    }
  }, [permission, requestPermission, router]);

  return {
    permission,
    handleCameraPress,
  };
}
