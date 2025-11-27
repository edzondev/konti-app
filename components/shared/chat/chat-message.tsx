import { View, Text } from 'react-native';
import { Bot, User } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/ai-extraction.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      className={cn(
        'flex-row items-start gap-3 px-4 py-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <View
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full',
          isUser ? 'bg-primary' : 'bg-secondary',
        )}
      >
        {isUser ? (
          <User size={18} color={COLORS.neutral.white} strokeWidth={2} />
        ) : (
          <Bot size={18} color={COLORS.neutral.white} strokeWidth={2} />
        )}
      </View>

      <View
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2',
          isUser
            ? 'rounded-tr-md bg-primary'
            : 'rounded-tl-md border border-neutral-border/30 bg-gray-50',
        )}
      >
        <Text
          className={cn(
            'text-base leading-relaxed',
            isUser ? 'text-white' : 'text-neutral-foreground',
          )}
        >
          {message.content}
        </Text>

        {message.timestamp && (
          <Text
            className={cn(
              'text-sm',
              isUser ? 'text-right text-white/60' : 'text-muted-foreground/60',
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
