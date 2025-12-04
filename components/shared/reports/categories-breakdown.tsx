import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { CATEGORY_COLORS } from '@/constants/reports';
import { formatCurrency } from '@/lib/format';
import { useMemo } from 'react';

type Category = {
  category: string;
  amount: number;
  count: number;
};

type CategoriesBreakdownProps = {
  categories: Category[];
};

export function CategoriesBreakdown({ categories }: CategoriesBreakdownProps) {
  const maxAmount = useMemo(() => {
    return Math.max(...categories.map((c) => c.amount));
  }, [categories]);

  if (categories.length === 0) return null;
  return (
    <View className="rounded-2xl border border-neutral-border bg-white p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
          Desglose por Categoría
        </Text>
        <View className="flex-row items-center gap-1">
          <TrendingUp size={14} color={COLORS.neutral.muted} strokeWidth={2} />
          <Text className="text-xs text-neutral-muted">
            {categories.length} categorías
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {categories.map((cat, index) => {
          const color =
            CATEGORY_COLORS[cat.category.toLowerCase()] || '#9CA3AF';
          const percentage = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;

          return (
            <View key={index}>
              <View className="mb-1.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-sm font-medium text-neutral-foreground">
                    {cat.category}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold text-primary-default">
                    {formatCurrency(cat.amount)}
                  </Text>
                  <View className="rounded-md bg-neutral-border px-1.5 py-0.5">
                    <Text className="text-[10px] font-medium text-neutral-muted">
                      {cat.count}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-neutral-border">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
