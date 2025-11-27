import { View, Text, Pressable } from 'react-native';
import { Bot, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type Props = {
  resetMessages: () => void;
};

export function ChatHeader({ resetMessages }: Props) {
  return (
    <View className="mb-4 border-b border-neutral-border/50 p-4">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={resetMessages}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <ChevronLeft
            size={22}
            color={COLORS.neutral.foreground}
            strokeWidth={2}
          />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Bot size={18} color={COLORS.secondary} strokeWidth={2} />
          </View>
          <Text className="text-lg font-medium text-neutral-foreground">
            Konti
          </Text>
        </View>
      </View>
    </View>
  );
}
