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
    activeClass: 'bg-primary',
    inactiveClass: 'bg-neutral-border',
    activeTextClass: 'text-white',
    inactiveTextClass: 'text-neutral-foreground',
    activeIconColor: COLORS.neutral.white,
    inactiveIconColor: COLORS.neutral.foreground,
  },
  {
    type: 'expense' as FilterType,
    label: 'Contables',
    Icon: TrendingUp,
    activeClass: 'bg-emerald-500',
    inactiveClass: 'bg-emerald-500/10',
    activeTextClass: 'text-white',
    inactiveTextClass: 'text-emerald-700',
    activeIconColor: '#fff',
    inactiveIconColor: '#047857',
  },
  {
    type: 'nonExpense' as FilterType,
    label: 'No contables',
    Icon: ReceiptText,
    activeClass: 'bg-indigo-500',
    inactiveClass: 'bg-indigo-500/10',
    activeTextClass: 'text-white',
    inactiveTextClass: 'text-indigo-700',
    activeIconColor: '#fff',
    inactiveIconColor: '#6366f1',
  },
  {
    type: 'boleta' as FilterType,
    label: 'Boletas',
    Icon: ReceiptText,
    activeClass: 'bg-blue-500',
    inactiveClass: 'bg-blue-500/10',
    activeTextClass: 'text-white',
    inactiveTextClass: 'text-blue-700',
    activeIconColor: '#fff',
    inactiveIconColor: '#2563eb',
  },
  {
    type: 'factura' as FilterType,
    label: 'Facturas',
    Icon: FileText,
    activeClass: 'bg-rose-500',
    inactiveClass: 'bg-rose-500/10',
    activeTextClass: 'text-white',
    inactiveTextClass: 'text-rose-700',
    activeIconColor: '#fff',
    inactiveIconColor: '#e11d48',
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
                color={isActive ? filter.activeIconColor : filter.inactiveIconColor}
              />
              <Text
                className={isActive ? filter.activeTextClass : filter.inactiveTextClass}
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

