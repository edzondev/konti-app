import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  ArrowUpDown,
  FileText,
  Filter,
  ReceiptText,
  TrendingUp,
} from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';
import type { FilterType } from '@/hooks/receipts/use-filter-receipt';

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
    Icon: Filter,
    activeClass: 'bg-primary-default',
    inactiveClass: 'bg-primary-default/10',
    activeTextClass: 'text-neutral-white',
    inactiveTextClass: 'text-primary-default',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.primary.default,
  },
  {
    type: 'expense' as FilterType,
    label: 'Contables',
    Icon: TrendingUp,
    activeClass: 'bg-success-default',
    inactiveClass: 'bg-success-default/10',
    activeTextClass: 'text-neutral-white',
    inactiveTextClass: 'text-success-default',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.success.default,
  },
  {
    type: 'nonExpense' as FilterType,
    label: 'No contables',
    Icon: ReceiptText,
    activeClass: 'bg-secondary-default',
    inactiveClass: 'bg-secondary-default/10',
    activeTextClass: 'text-neutral-white',
    inactiveTextClass: 'text-secondary-default',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.secondary.default,
  },
  {
    type: 'boleta' as FilterType,
    label: 'Boletas',
    Icon: ReceiptText,
    activeClass: 'bg-primary-default',
    inactiveClass: 'bg-primary-default/10',
    activeTextClass: 'text-neutral-white',
    inactiveTextClass: 'text-primary-default',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.primary.default,
  },
  {
    type: 'factura' as FilterType,
    label: 'Facturas',
    Icon: FileText,
    activeClass: 'bg-destructive-default',
    inactiveClass: 'bg-destructive-default/10',
    activeTextClass: 'text-neutral-white',
    inactiveTextClass: 'text-destructive-default',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.destructive.default,
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
                'flex-row items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-light',
                isActive ? filter.activeClass : filter.inactiveClass,
              )}
            >
              <filter.Icon
                size={16}
                color={
                  isActive ? filter.activeIconColor : filter.inactiveIconColor
                }
              />
              <Text
                className={
                  isActive ? filter.activeTextClass : filter.inactiveTextClass
                }
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onToggleSortOrder}
          className="flex-row items-center gap-2 whitespace-nowrap rounded-full bg-violet-500/10 px-4 py-2 text-sm font-light transition-all hover:bg-violet-500/20"
        >
          <ArrowUpDown size={16} color="#9333EA" />
          <Text className="text-violet-700">
            {sortBy === 'date_desc' ? 'Más recientes' : 'Más antiguos'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
