import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

interface ChatErrorProps {
  message: string;
}

export function ChatError({ message }: ChatErrorProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="mx-4 mt-3 flex-row items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle size={18} color={COLORS.destructive} strokeWidth={2} />
      </View>
      <Text className="font-regular flex-1 text-sm text-destructive">
        {message}
      </Text>
    </Animated.View>
  );
}
