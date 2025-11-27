import { View, Text } from 'react-native';
import { TrendingUp, Target } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type { DeductionLimitStatus } from '@/types/ai-extraction.types';

interface DeductionLimitCardProps {
  data: DeductionLimitStatus | null;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function DeductionLimitCard({
  data,
  isLoading,
}: DeductionLimitCardProps) {
  if (isLoading) {
    return (
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <View className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200" />
        <View className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const percentage = Math.min(data.percentage_used, 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Target size={16} color={COLORS.primary} strokeWidth={2} />
          </View>
          <Text className="text-foreground text-base font-semibold">
            Límite Anual SUNAT
          </Text>
        </View>
        <View
          className={`rounded-full px-2 py-1 ${
            isOverLimit
              ? 'bg-destructive/10'
              : isNearLimit
                ? 'bg-amber-100'
                : 'bg-green-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isOverLimit
                ? 'text-destructive'
                : isNearLimit
                  ? 'text-amber-700'
                  : 'text-green-700'
            }`}
          >
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View className="mt-4">
        <View className="h-3 overflow-hidden rounded-full bg-gray-100">
          <View
            className={`h-full rounded-full ${
              isOverLimit
                ? 'bg-destructive'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>

      <View className="mt-4 flex-row justify-between">
        <View>
          <Text className="text-muted text-xs">Deducido</Text>
          <Text className="text-foreground text-base font-semibold">
            {formatCurrency(data.total_deductible)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-muted text-xs">Disponible</Text>
          <Text className="text-base font-semibold text-green-600">
            {formatCurrency(data.remaining)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-1">
        <TrendingUp size={12} color={COLORS.muted.foreground} />
        <Text className="text-muted text-xs">
          Límite: {formatCurrency(data.annual_limit)} (3 UIT)
        </Text>
      </View>
    </View>
  );
}
