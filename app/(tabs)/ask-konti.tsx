import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          {messages.length > 0 && <ChatHeader resetMessages={clearChat} />}

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
          {contextSummary && messages.length > 0 && (
            <ContextSummary
              totalReceipts={contextSummary.total_receipts}
              percentageUsed={contextSummary.percentage_used}
            />
          )}

          {showCounter && (
            <Text className="text-neutral-muted mb-3 text-center text-xs">
              {messagesRemaining} mensaje{messagesRemaining !== 1 ? 's' : ''}{' '}
              restante{messagesRemaining !== 1 ? 's' : ''}
            </Text>
          )}

          {showLimitReached ? (
            <MessageLimitReached />
          ) : (
            <>
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                placeholder="Escribe tu pregunta a Konti..."
              />
              <Text className="text-neutral-muted/70 text-center text-xs leading-tight">
                Konti es una herramienta de organización. Para decisiones
                tributarias importantes, consulta con un contador profesional.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
