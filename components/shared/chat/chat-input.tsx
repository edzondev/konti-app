import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Escribe tu pregunta...',
  maxLength = 500,
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <View className="bg-white py-3">
      <View className="flex-row items-end gap-3 rounded-2xl border border-neutral-border bg-neutral-border/20 px-4 py-2">
        <Input
          value={message}
          onChangeText={setMessage}
          maxLength={maxLength}
          editable={!isLoading}
          multiline
          className="font-regular flex-1 border-b-0 py-2 text-base"
          placeholder={placeholder}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend || isLoading}
          className="bg-secondary-default h-10 w-10 items-center justify-center rounded-full disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.neutral.white} />
          ) : (
            <ArrowUp size={20} color={COLORS.neutral.white} strokeWidth={2.5} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
