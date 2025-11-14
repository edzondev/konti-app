import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';

export function useCameraControls() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  const takePicture = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          shutterSound: false,
        });
        if (photo) {
          router.push({
            pathname: '/photo-preview',
            params: { imageUri: photo.uri },
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(
          'Error',
          'No se pudo capturar la foto. Intenta nuevamente.',
        );
      }
    }
  }, [router]);

  const toggleFlash = useCallback(() => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  }, []);

  return {
    cameraRef,
    flash,
    takePicture,
    toggleFlash,
  };
}
