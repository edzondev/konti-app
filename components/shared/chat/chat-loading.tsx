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
      <View className="bg-secondary-default h-9 w-9 items-center justify-center rounded-full shadow-sm">
        <Bot size={18} color={COLORS.neutral.white} strokeWidth={2} />
      </View>
      <View className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
        <View className="flex-row items-center gap-1.5">
          <View className="bg-secondary-default/60 h-2 w-2 animate-pulse rounded-full" />
          <View className="bg-secondary-default/40 h-2 w-2 animate-pulse rounded-full" />
          <View className="bg-secondary-default/20 h-2 w-2 animate-pulse rounded-full" />
        </View>
      </View>
    </Animated.View>
  );
}
