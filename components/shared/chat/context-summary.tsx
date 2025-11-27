import { View, Text } from 'react-native';
import { MessageCircle, TrendingUp } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type ContextSummaryProps = {
  totalReceipts: number;
  percentageUsed: number;
};

export function ContextSummary({
  totalReceipts,
  percentageUsed,
}: ContextSummaryProps) {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-gray-50/80 px-4 py-2.5">
      <View className="flex-row items-center gap-2">
        <View className="h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <MessageCircle size={12} color={COLORS.primary} strokeWidth={2} />
        </View>
        <Text className="text-xs font-medium text-muted-foreground">
          {totalReceipts} comprobantes
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-6 w-6 items-center justify-center rounded-md bg-secondary/10">
          <TrendingUp size={12} color={COLORS.secondary} strokeWidth={2} />
        </View>
        <Text className="text-xs font-medium text-muted-foreground">
          Límite: {percentageUsed.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}
