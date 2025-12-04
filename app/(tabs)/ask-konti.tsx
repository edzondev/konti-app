import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { ChatInput } from '@/components/shared/chat/chat-input';
import { ChatMessage } from '@/components/shared/chat/chat-message';
import { ChatHeader } from '@/components/shared/chat/chat-header';
import { ChatFooter } from '@/components/shared/chat/chat-footer';
import { ContextSummary } from '@/components/shared/chat/context-summary';
import EmptyChat from '@/components/shared/chat/empty-chat';
import { MessageLimitReached } from '@/components/shared/chat/message-limit-reached';
import { useAskKonti } from '@/hooks/chat/use-ask-konti';
import { useFreeMessages } from '@/hooks/chat/use-free-messages';
import { QUICK_PROMPT_FEATURES } from '@/constants/chat';
import MainLayout from '@/components/layouts/main-layout';

export default function AskKontiScreen() {
  const {
    messages,
    isLoading,
    error,
    contextSummary,
    sendMessage,
    sendQuickPrompt,
    clearChat,
  } = useAskKonti();

  const { messagesRemaining, hasReachedLimit, currentPlan } = useFreeMessages();

  const showLimitReached = hasReachedLimit && currentPlan === 'free';
  const showCounter =
    !showLimitReached &&
    currentPlan === 'free' &&
    messagesRemaining < 5 &&
    messagesRemaining !== Number.POSITIVE_INFINITY;

  return (
    <MainLayout edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          {messages.length > 0 && (
            <ChatHeader resetMessages={clearChat} currentPlan={currentPlan} />
          )}

          <FlashList
            data={messages}
            keyExtractor={(item) => item.timestamp ?? item.content}
            renderItem={({ item }) => <ChatMessage message={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              messages.length === 0
                ? {
                    flexGrow: 1,
                    justifyContent: 'center',
                  }
                : { paddingTop: 8, paddingBottom: 16 }
            }
            ListEmptyComponent={
              <EmptyChat
                features={QUICK_PROMPT_FEATURES}
                sendQuickPrompt={sendQuickPrompt}
                isLoading={isLoading}
                disabled={showLimitReached}
              />
            }
            ListFooterComponent={
              messages.length > 0 ? (
                <ChatFooter isLoading={isLoading} error={error} />
              ) : null
            }
          />
        </View>

        <View className="flex-col border-t border-neutral-border/30 p-4">
          {showCounter && (
            <>
              <MessageLimitReached
                message={`Tienes ${messagesRemaining} mensaje${messagesRemaining !== 1 ? 's' : ''} restante${messagesRemaining !== 1 ? 's' : ''}`}
                description="Suscribete para desbloquear más mensajes."
              />
            </>
          )}
          {contextSummary && messages.length > 0 && (
            <ContextSummary
              totalReceipts={contextSummary.total_receipts}
              percentageUsed={contextSummary.percentage_used}
            />
          )}

          {showLimitReached ? (
            <MessageLimitReached message="Has alcanzado tu límite de mensajes." />
          ) : (
            <>
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                placeholder="Escribe tu pregunta a Konti..."
              />
              <Text className="text-center text-xs leading-tight text-neutral-muted/70">
                Konti es una herramienta de organización. Para decisiones
                tributarias importantes, consulta con un contador profesional.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}
