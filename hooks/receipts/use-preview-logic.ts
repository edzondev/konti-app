import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useAiExtraction } from '@/hooks/receipts/use-ai-extraction';
import { AiExtractedData, DocumentType } from '@/types/ai-extraction.types';
import { useAiTrialStore } from '@/store/use-ai-trial-store';

type UsePreviewLogicProps = {
  imageUrl?: string;
};

// Pure helper functions for permission logic
function shouldRedirectToSubscription(
  hasUsedAiTrial: boolean,
  hasPlus: boolean,
): boolean {
  return hasUsedAiTrial && !hasPlus;
}

function getAiButtonText(hasUsedAiTrial: boolean, hasPlus: boolean): string {
  return shouldRedirectToSubscription(hasUsedAiTrial, hasPlus)
    ? 'Suscribete para procesar imagen'
    : 'Procesar imagen';
}

export function usePreviewLogic({ imageUrl }: UsePreviewLogicProps) {
  const router = useRouter();
  const { hasPlus } = useUserPlan();
  const { hasUsedAiTrial, setHasUsedAiTrial } = useAiTrialStore();
  const { mutateAsync: extractData, isPending: isExtractingData } =
    useAiExtraction();

  const [extractedData, setExtractedData] = useState<AiExtractedData>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('boleta');

  // Memoized derived values
  const canUseAi = useMemo(
    () => hasPlus || !hasUsedAiTrial,
    [hasPlus, hasUsedAiTrial],
  );

  const isTrialMode = useMemo(
    () => !hasPlus && !hasUsedAiTrial,
    [hasPlus, hasUsedAiTrial],
  );

  const aiButtonText = useMemo(
    () => getAiButtonText(hasUsedAiTrial, hasPlus),
    [hasUsedAiTrial, hasPlus],
  );

  const handleSubscriptionRedirect = useCallback(() => {
    router.push('/subscription');
  }, [router]);

  const handleAiExtraction = useCallback(async () => {
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

      const message = isTrialMode
        ? 'Información extraída correctamente. El formulario se ha autocompletado.\n\n¡Esta fue tu prueba gratuita! Suscríbete para seguir usando esta función.'
        : 'Información extraída correctamente. El formulario se ha autocompletado.';

      Alert.alert('Éxito', message);
    } catch (error) {
      console.error('Error en extracción:', error);
      Alert.alert('Error', 'No se pudo extraer la información de la imagen');
    }
  }, [imageUrl, extractData, isTrialMode, setHasUsedAiTrial]);

  const handleButtonPress = useCallback(async () => {
    if (shouldRedirectToSubscription(hasUsedAiTrial, hasPlus)) {
      handleSubscriptionRedirect();
      return;
    }

    await handleAiExtraction();
  }, [hasUsedAiTrial, hasPlus, handleSubscriptionRedirect, handleAiExtraction]);

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
    aiButtonText,
  };
}
