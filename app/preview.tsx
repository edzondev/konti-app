import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ImageComponent from '@/components/ui/image';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Sparkle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import ReceiptForm from '@/components/shared/forms/receipt-form';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useAiExtraction } from '@/hooks/receipts/use-ai-extraction';
import { AiExtractedData } from '@/types/ai-extraction.types';

export default function Preview() {
  const { imageUrl } = useLocalSearchParams<{
    imageUrl: string;
  }>();
  const router = useRouter();
  const { hasProOrBetter } = useUserPlan();
  const { mutateAsync: extractData, isPending: isExtractingData } =
    useAiExtraction();
  const [extractedData, setExtractedData] = useState<
    AiExtractedData | undefined
  >();

  const handleButtonPress = async () => {
    if (!hasProOrBetter) {
      router.push('/subscription');
      return;
    }

    if (!imageUrl) return;

    try {
      const response = await extractData(imageUrl);
      if (response.success && response.data) {
        setExtractedData(response.data);
        Alert.alert(
          'Éxito',
          'Información extraída correctamente. El formulario se ha autocompletado.',
        );
      } else {
        Alert.alert('Error', 'No se pudieron extraer los datos de la imagen');
      }
    } catch (error) {
      console.error('Error en extracción:', error);
      Alert.alert('Error', 'No se pudo extraer la información de la imagen');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-8">
          {imageUrl && (
            <View className="mb-8">
              <ImageComponent
                src={imageUrl}
                contentFit="cover"
                alt="Comprobante de pago"
                style={{ width: '100%', height: 350 }}
              />
            </View>
          )}

          <View className="mb-8">
            <Pressable
              onPress={handleButtonPress}
              disabled={isExtractingData}
              className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-primary py-3 transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtractingData ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Sparkle size={18} color={COLORS.primary} />
                  <Text className="font-regular text-base text-primary">
                    {hasProOrBetter
                      ? 'Extraer información con IA'
                      : 'Suscríbete para usar esta función'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Formulario de Comprobante */}
          <ReceiptForm imageUrl={imageUrl} extractedData={extractedData} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
