import { View, Text, Pressable } from 'react-native';
import { Calendar, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { AVAILABLE_YEARS } from '@/constants/reports';

type YearSelectorProps = {
  selectedYear: number;
  showYearPicker: boolean;
  onTogglePicker: () => void;
  onSelectYear: (year: number) => void;
};

export function YearSelector({
  selectedYear,
  showYearPicker,
  onTogglePicker,
  onSelectYear,
}: YearSelectorProps) {
  return (
    <>
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        Seleccionar período
      </Text>

      <Pressable
        onPress={onTogglePicker}
        className="flex-row items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5"
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-primary-default/10 h-9 w-9 items-center justify-center rounded-lg">
            <Calendar
              size={18}
              color={COLORS.primary.default}
              strokeWidth={2}
            />
          </View>
          <View>
            <Text className="text-lg font-semibold text-[#0f172a]">
              {selectedYear}
            </Text>
            <Text className="text-xs text-[#94a3b8]">Año fiscal</Text>
          </View>
        </View>
        <ChevronDown
          size={20}
          color="#94a3b8"
          style={{
            transform: [{ rotate: showYearPicker ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {showYearPicker && (
        <View className="mt-3 overflow-hidden rounded-xl border border-neutral-border bg-white">
          {AVAILABLE_YEARS.map((year, index) => (
            <Pressable
              key={year}
              onPress={() => onSelectYear(year)}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                index !== AVAILABLE_YEARS.length - 1
                  ? 'border-b border-neutral-border'
                  : ''
              } ${year === selectedYear ? 'bg-primary-default/5' : ''}`}
            >
              <Text
                className={`text-base ${
                  year === selectedYear
                    ? 'text-primary-default font-semibold'
                    : 'text-neutral-muted'
                }`}
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
        </View>
      )}
    </>
  );
}
