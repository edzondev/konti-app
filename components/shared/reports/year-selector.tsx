import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { AVAILABLE_YEARS } from '@/constants/reports';
import { cn } from '@/lib/utils';

type YearSelectorProps = {
  selectedYear: number;
  showYearPicker: boolean;
  onTogglePicker: () => void;
  onSelectYear: (year: number) => void;
};

const ANIMATION_DURATION = 250;
const MAX_HEIGHT = 300;

export function YearSelector({
  selectedYear,
  showYearPicker,
  onTogglePicker,
  onSelectYear,
}: YearSelectorProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(showYearPicker ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [showYearPicker, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    maxHeight: progress.value * MAX_HEIGHT,
    opacity: progress.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));
  return (
    <>
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        Seleccionar período
      </Text>

      <Pressable
        onPress={onTogglePicker}
        className="flex-row items-center justify-between rounded-xl border border-neutral-border/50 bg-white px-4 py-3.5"
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-col items-start">
            <Text className="text-lg font-semibold text-[#0f172a]">
              {selectedYear}
            </Text>
            <Text className="text-xs text-neutral-muted">Año fiscal</Text>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={COLORS.neutral.muted} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={[containerStyle]}
        className="mt-3 overflow-hidden rounded-xl border border-neutral-border/50 bg-white"
      >
        {AVAILABLE_YEARS.map((year, index) => (
          <Pressable
            key={year}
            onPress={() => onSelectYear(year)}
            className={cn(
              'flex-row items-center justify-between px-4 py-3.5',
              index !== AVAILABLE_YEARS.length - 1 &&
                'border-b border-neutral-border/50 odd:border-y-0 odd:border-b-0',
              year === selectedYear && 'bg-primary-default/5',
            )}
          >
            <Text
              className={cn(
                'text-base',
                year === selectedYear
                  ? 'font-semibold text-primary-default'
                  : 'text-neutral-muted',
              )}
            >
              {year}
            </Text>
            {year === selectedYear && (
              <CheckCircle2
                size={18}
                color={COLORS.primary.default}
                strokeWidth={2}
              />
            )}
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}
