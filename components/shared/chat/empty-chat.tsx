import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
};

type EmptyChatProps = {
  features: Feature[];
  sendQuickPrompt: (id: string) => void;
  isLoading: boolean;
  disabled?: boolean;
};

export default function EmptyChat({
  features,
  sendQuickPrompt,
  isLoading,
  disabled = false,
}: EmptyChatProps) {
  return (
    <View className="flex-1 justify-center px-4">
      <Animated.View
        entering={FadeIn.duration(600)}
        className="mb-10 items-center"
      >
        <Text className="text-secondary-default mb-2 text-center text-2xl font-bold">
          ¡Hola! Soy Konti
        </Text>
        <Text className="text-neutral-muted text-center text-lg">
          ¿En qué puedo ayudarte hoy?
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="flex-row flex-wrap justify-between gap-y-4"
      >
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Pressable
              key={feature.id}
              onPress={() => sendQuickPrompt(feature.id)}
              disabled={isLoading || disabled}
              style={{ width: '48%' }}
              className="rounded-2xl border border-neutral-border p-4 active:opacity-80 disabled:opacity-50"
            >
              <Animated.View
                entering={FadeInDown.delay(300 + index * 100).duration(400)}
              >
                <View
                  className="mb-3 h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: feature.iconBgColor }}
                >
                  <IconComponent
                    size={18}
                    color={feature.iconColor}
                    strokeWidth={2}
                  />
                </View>

                <Text className="mb-1 text-base font-semibold text-neutral-foreground">
                  {feature.title}
                </Text>

                <Text className="text-neutral-muted text-sm leading-tight">
                  {feature.description}
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}
