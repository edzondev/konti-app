import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useAiExtraction } from '@/hooks/receipts/use-ai-extraction';
import { AiExtractedData, DocumentType } from '@/types/ai-extraction.types';
import { useAiTrialStore } from '@/store/use-ai-trial-store';

type UsePreviewLogicProps = {
  imageUrl?: string;
};

export function usePreviewLogic({ imageUrl }: UsePreviewLogicProps) {
  const router = useRouter();
  const { hasProOrBetter } = useUserPlan();
  const { hasUsedAiTrial, setHasUsedAiTrial } = useAiTrialStore();
  const { mutateAsync: extractData, isPending: isExtractingData } =
    useAiExtraction();

  const [extractedData, setExtractedData] = useState<AiExtractedData>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('boleta');

  const canUseAi = hasProOrBetter || !hasUsedAiTrial;
  const isTrialMode = !hasProOrBetter && !hasUsedAiTrial;

  const handleButtonPress = useCallback(async () => {
    if (!canUseAi) {
      router.push({
        pathname: '/subscription',
        params: { fromPreview: 'true', imageUrl },
      });
      return;
    }

    if (!imageUrl) return;

    try {
      const response = await extractData(imageUrl);

      if (!response.success || !response.data) {
        Alert.alert('Error', 'No se pudieron extraer los datos de la imagen');
        return;
      }

      setExtractedData(response.data);
      setDocumentType(response.data.tipo_comprobante);

      if (isTrialMode) {
        setHasUsedAiTrial(true);
      }

      const baseMessage =
        'Información extraída correctamente. El formulario se ha autocompletado.';
      const successMessage = isTrialMode
        ? `${baseMessage}\n\n¡Esta fue tu prueba gratuita! Suscríbete para seguir usando esta función.`
        : baseMessage;

      Alert.alert('Éxito', successMessage);
    } catch (error) {
      console.error('Error en extracción:', error);
      Alert.alert('Error', 'No se pudo extraer la información de la imagen');
    }
  }, [canUseAi, imageUrl, extractData, isTrialMode, setHasUsedAiTrial, router]);

  const toggleModal = useCallback(() => {
    setIsModalVisible((prev) => !prev);
  }, []);

  return {
    extractedData,
    isModalVisible,
    documentType,
    setDocumentType,
    isExtractingData,
    handleButtonPress,
    toggleModal,
    canUseAi,
  };
}
