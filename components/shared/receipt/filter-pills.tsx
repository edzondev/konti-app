import { View, Text, Pressable, ScrollView } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';
import type { FilterType } from '@/hooks/receipts/use-filter-receipt';
import IconCheck from '@/assets/icons/icon-check.svg';
import CustomIcon from '../icon/custom-icon';

type FilterPillsProps = {
  currentFilter: FilterType;
  sortBy: 'date_desc' | 'date_asc';
  onFilterChange: (filter: FilterType) => void;
  onToggleSortOrder: () => void;
};

const FILTER_CONFIG = [
  {
    type: 'all' as FilterType,
    label: 'Todas',
  },
  {
    type: 'expense' as FilterType,
    label: 'Contables',
  },
  {
    type: 'nonExpense' as FilterType,
    label: 'No contables',
  },
  {
    type: 'boleta' as FilterType,
    label: 'Boletas',
  },
  {
    type: 'factura' as FilterType,
    label: 'Facturas',
  },
];

export function FilterPills({
  currentFilter,
  sortBy,
  onFilterChange,
  onToggleSortOrder,
}: FilterPillsProps) {
  return (
    <View className="mt-2">
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
        keyboardShouldPersistTaps="handled"
        horizontal
      >
        {FILTER_CONFIG.map((filter) => {
          const isActive = currentFilter === filter.type;
          return (
            <Pressable
              key={filter.type}
              onPress={() => onFilterChange(filter.type)}
              className={cn(
                'flex-row items-center gap-x-2 whitespace-nowrap rounded-full border border-neutral-border px-4 py-2 text-sm font-light transition-all duration-300 ease-in-out',
                isActive ? 'border-primary-default' : 'border-neutral-border',
              )}
            >
              {isActive && (
                <CustomIcon
                  icon={IconCheck}
                  color={COLORS.primary.default}
                  size={18}
                />
              )}
              <Text
                className={cn(
                  isActive ? 'text-primary-default' : 'text-neutral-muted',
                )}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onToggleSortOrder}
          className="flex-row items-center gap-2 whitespace-nowrap rounded-full border border-neutral-border bg-white px-4 py-2 text-sm font-light"
        >
          <ArrowUpDown size={16} color={COLORS.neutral.muted} />
          <Text className="text-neutral-foreground">
            {sortBy === 'date_desc' ? 'Más recientes' : 'Más antiguos'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
