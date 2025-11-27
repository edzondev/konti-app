import { View, Text } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { formatCurrency } from '@/lib/format';

type DeductibleAmountCardProps = {
  deductibleAmount: number;
  percentageOfLimit: string;
};

export function DeductibleAmountCard({
  deductibleAmount,
  percentageOfLimit,
}: DeductibleAmountCardProps) {
  return (
    <View className="mb-4 rounded-2xl border border-neutral-border bg-primary p-5">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="mb-1 text-sm font-medium text-white">
            Monto Total Deducible
          </Text>
          <Text className="text-3xl font-bold text-white">
            {formatCurrency(deductibleAmount)}
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Wallet size={24} color={COLORS.neutral.white} strokeWidth={2} />
        </View>
      </View>

      <View className="mt-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs text-white">Límite SUNAT utilizado</Text>
          <Text className="text-sm font-semibold text-white">
            {percentageOfLimit}%
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-white/20">
          <View
            className="h-full rounded-full bg-white"
            style={{
              width: `${Math.min(parseFloat(percentageOfLimit) || 0, 100)}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}

