import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ReceiptForm from '@/components/shared/forms/receipt-form';
import ImageThumbnail from '@/components/shared/receipt/image-thumbnail';
import { ImagePreviewModal } from '@/components/shared/modals/image-preview-modal';
import { AiExtractionLoadingModal } from '@/components/shared/modals/ai-extraction-loading-modal';
import { AiExtractionResultModal } from '@/components/shared/modals/ai-extraction-result-modal';
import { usePreviewLogic } from '@/hooks/receipts/use-preview-logic';
import MainLayout from '@/components/layouts/main-layout';

export default function Preview() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>();

  const {
    extractedData,
    isModalVisible,
    isLoadingModalVisible,
    isResultModalVisible,
    resultModalType,
    resultModalTitle,
    resultModalMessage,
    isExtractingData,
    handleButtonPress,
    toggleModal,
    handleCloseResultModal,
    aiButtonText,
  } = usePreviewLogic({ imageUrl });

  return (
    <MainLayout edges={['bottom', 'top']}>
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

      {/* AI Extraction Loading Modal */}
      <AiExtractionLoadingModal visible={isLoadingModalVisible} />

      {/* AI Extraction Result Modal */}
      <AiExtractionResultModal
        visible={isResultModalVisible}
        onClose={handleCloseResultModal}
        type={resultModalType}
        title={resultModalTitle}
        message={resultModalMessage}
      />
    </MainLayout>
  );
}
