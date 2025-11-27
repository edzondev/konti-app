import { View, Text, Pressable } from 'react-native';
import { Bot } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type EmptyChatProps = {
  features: {
    id: string;
    text: string;
    icon: React.ElementType;
  }[];
  sendQuickPrompt: (id: string) => void;
  isLoading: boolean;
};

export default function EmptyChat({
  features,
  sendQuickPrompt,
  isLoading,
}: EmptyChatProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-8">
      <Animated.View entering={FadeIn.duration(600)} className="mb-8">
        <View className="relative">
          <View className="absolute -inset-3 rounded-full bg-secondary/10" />
          <View className="h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-secondary/20 to-primary/10">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <Bot size={44} color={COLORS.secondary} strokeWidth={1.5} />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(150).duration(500)}
        className="mb-8"
      >
        <Text className="mb-3 text-center text-2xl tracking-tight text-neutral-foreground">
          ¡Hola! Soy Konti
        </Text>
        <Text className="text-center text-base leading-relaxed text-muted-foreground">
          Tu asistente tributario. Pregúntame sobre tus gastos, deducciones o
          cualquier duda sobre tus comprobantes.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        className="w-full gap-3"
      >
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Pressable
              key={feature.id}
              onPress={() => sendQuickPrompt(feature.id)}
              disabled={isLoading}
              className="flex-row items-center gap-3 rounded-2xl border border-neutral-border/50 bg-white px-4 py-3.5 shadow-sm active:scale-95 active:bg-gray-50"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary/10">
                <IconComponent
                  size={18}
                  color={COLORS.secondary}
                  strokeWidth={2}
                />
              </View>
              <Text className="flex-1 text-sm font-medium text-neutral-foreground">
                {feature.text}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}
