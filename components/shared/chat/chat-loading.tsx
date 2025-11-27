import { View } from 'react-native';
import { Bot } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

export function ChatLoading() {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-row items-start gap-3 px-4 py-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary shadow-sm">
        <Bot size={18} color={COLORS.neutral.white} strokeWidth={2} />
      </View>
      <View className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 animate-pulse rounded-full bg-secondary/60" />
          <View className="h-2 w-2 animate-pulse rounded-full bg-secondary/40" />
          <View className="h-2 w-2 animate-pulse rounded-full bg-secondary/20" />
        </View>
      </View>
    </Animated.View>
  );
}
