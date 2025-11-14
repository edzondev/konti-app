import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUploadImage } from '@/hooks/receipts/use-upload-image';

export function useGalleryPicker() {
  const router = useRouter();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();

  const handleGalleryPress = useCallback(async () => {
    try {
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
    }
  }, [uploadImage, router]);

  return {
    handleGalleryPress,
    isUploading,
  };
}
