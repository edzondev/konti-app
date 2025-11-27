import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUploadImage } from '@/hooks/receipts/use-upload-image';

export function useGalleryPicker() {
  const router = useRouter();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();
  const [permissionStatus, setPermissionStatus] =
    useState<ImagePicker.PermissionStatus | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        setPermissionStatus(status);
      }
    })();
  }, []);

  const handleGalleryPress = useCallback(async () => {
    try {
      if (permissionStatus !== ImagePicker.PermissionStatus.GRANTED) {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tu galería para seleccionar imágenes.',
          );
          return;
        }
        setPermissionStatus(status);
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const imageUri = result.assets[0].uri;
      const imageUrl = await uploadImage(imageUri);

      router.push({
        pathname: '/preview',
        params: { imageUrl },
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
    }
  }, [uploadImage, router, permissionStatus]);

  return {
    handleGalleryPress,
    isUploading,
  };
}
