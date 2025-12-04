import { View, Text } from 'react-native';
import { Receipt, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type ReportSummaryStatsProps = {
  totalReceipts: number;
  deductibleReceipts: number;
};

export function ReportSummaryStats({
  totalReceipts,
  deductibleReceipts,
}: ReportSummaryStatsProps) {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 flex-row items-start gap-3 rounded-2xl border border-neutral-border bg-white p-4">
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-primary-default/5">
          <Receipt size={18} color={COLORS.primary.default} strokeWidth={2} />
        </View>
        <View className="flex-col items-start">
          <Text className="text-2xl font-bold text-neutral-foreground">
            {totalReceipts}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-muted">
            Comprobantes
          </Text>
        </View>
      </View>

      <View className="flex-1 flex-row items-start gap-3 rounded-2xl border border-neutral-border bg-white p-4">
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-success-default/5">
          <CheckCircle2
            size={18}
            color={COLORS.success.default}
            strokeWidth={2}
          />
        </View>
        <View className="flex-col items-start">
          <Text className="text-2xl font-bold text-neutral-foreground">
            {deductibleReceipts}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-muted">Deducibles</Text>
        </View>
      </View>
    </View>
  );
}
