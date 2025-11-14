import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUploadImage } from '@/hooks/receipts/use-upload-image';

type UsePhotoPreviewProps = {
  imageUri?: string;
};

export function usePhotoPreview({ imageUri }: UsePhotoPreviewProps) {
  const router = useRouter();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();

  const handleContinue = useCallback(async () => {
    if (!imageUri) return;

    try {
      const imageUrl = await uploadImage(imageUri);
      router.replace({
        pathname: '/preview',
        params: { imageUrl },
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
    }
  }, [imageUri, uploadImage, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return {
    isUploading,
    handleContinue,
    handleClose,
  };
}
