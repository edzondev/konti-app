import { View, Text, Pressable } from 'react-native';
import { Bot, RotateCcw } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type Props = {
  resetMessages: () => void;
};

export function ChatHeader({ resetMessages }: Props) {
  return (
    <View className="mb-4 border-b border-neutral-border/50 p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-secondary-default/10 h-12 w-12 items-center justify-center rounded-full">
            <Bot size={24} color={COLORS.secondary.default} strokeWidth={2} />
          </View>
          <Text className="text-2xl font-bold text-neutral-foreground">
            Konti
          </Text>
        </View>
        <Pressable
          onPress={resetMessages}
          className="bg-secondary-default/10 flex-row items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 active:opacity-80"
        >
          <RotateCcw
            size={16}
            color={COLORS.secondary.default}
            strokeWidth={2}
          />
          <Text className="text-secondary-default text-sm font-medium">
            Reiniciar chat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
