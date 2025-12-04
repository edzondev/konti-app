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
      className="border-destructive-default/20 bg-destructive-default/5 mx-4 mt-3 flex-row items-center gap-3 rounded-xl border px-4 py-3"
    >
      <View className="bg-destructive-default/10 h-8 w-8 items-center justify-center rounded-full">
        <AlertTriangle
          size={18}
          color={COLORS.destructive.default}
          strokeWidth={2}
        />
      </View>
      <Text className="font-regular text-destructive-default flex-1 text-sm">
        {message}
      </Text>
    </Animated.View>
  );
}
