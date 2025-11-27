import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  PieChart,
  AlertCircle,
  FileText,
  Lightbulb,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import type { QuickPrompt } from '@/types/ai-extraction.types';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  'chart-pie': PieChart,
  'alert-circle': AlertCircle,
  'file-text': FileText,
  lightbulb: Lightbulb,
};

interface QuickPromptsProps {
  prompts: QuickPrompt[];
  onSelect: (promptId: string) => void;
  disabled?: boolean;
}

export function QuickPrompts({
  prompts,
  onSelect,
  disabled = false,
}: QuickPromptsProps) {
  return (
    <View className="border-t border-neutral-border/30 bg-gray-50/50 py-4">
      <View className="mb-3 flex-row items-center gap-2 px-4">
        <Zap size={14} color={COLORS.secondary} strokeWidth={2} />
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preguntas rápidas
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {prompts.map((prompt, index) => {
          const IconComponent = ICON_MAP[prompt.icon] || FileText;

          return (
            <Animated.View
              key={prompt.id}
              entering={FadeInRight.delay(index * 80).duration(400)}
            >
              <Pressable
                onPress={() => onSelect(prompt.id)}
                disabled={disabled}
                className={cn(
                  'flex-row items-center gap-2.5 rounded-xl border border-neutral-border/40 bg-white px-4 py-2.5 shadow-sm',
                  disabled ? 'opacity-40' : 'active:scale-95 active:bg-gray-50',
                )}
              >
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <IconComponent
                    size={14}
                    color={COLORS.primary}
                    strokeWidth={2.5}
                  />
                </View>
                <Text className="text-sm font-medium text-neutral-foreground">
                  {prompt.text}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
