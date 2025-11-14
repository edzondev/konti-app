import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ReceiptForm from '@/components/shared/forms/receipt-form';
import ImageThumbnail from '@/components/shared/receipt/image-thumbnail';
import { ImagePreviewModal } from '@/components/shared/modals/image-preview-modal';
import { usePreviewLogic } from '@/hooks/receipts/use-preview-logic';

export default function Preview() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>();

  const {
    extractedData,
    isModalVisible,
    isExtractingData,
    handleButtonPress,
    toggleModal,
    canUseAi,
  } = usePreviewLogic({ imageUrl });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-8">
            {imageUrl && (
              <View className="mb-8">
                <ImageThumbnail
                  imageUrl={imageUrl}
                  onPress={toggleModal}
                  onAiPress={handleButtonPress}
                  showAiButton={canUseAi}
                  isAiLoading={isExtractingData}
                  size="md"
                />
              </View>
            )}
            <ReceiptForm imageUrl={imageUrl} extractedData={extractedData} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {imageUrl && (
        <ImagePreviewModal
          visible={isModalVisible}
          imageUrl={imageUrl}
          onClose={toggleModal}
        />
      )}
    </SafeAreaView>
  );
}
