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
    aiButtonText,
  } = usePreviewLogic({ imageUrl });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-5 pb-6 pt-4">
            {/* Image Section */}
            {imageUrl && (
              <View className="mb-6" style={{ marginBottom: 24 }}>
                <ImageThumbnail
                  imageUrl={imageUrl}
                  onPress={toggleModal}
                  onAiPress={handleButtonPress}
                  isAiLoading={isExtractingData}
                  aiButtonText={aiButtonText}
                  size="md"
                />
              </View>
            )}

            {/* Form Section */}
            <ReceiptForm imageUrl={imageUrl} extractedData={extractedData} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
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
