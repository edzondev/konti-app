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
    <View className="mb-4 flex-row gap-3">
      <View className="flex-1 rounded-2xl border border-neutral-border bg-white p-4">
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <Receipt size={18} color={COLORS.primary.default} strokeWidth={2} />
        </View>
        <Text className="text-2xl font-bold text-neutral-foreground">
          {totalReceipts}
        </Text>
        <Text className="text-neutral-muted mt-0.5 text-xs">Comprobantes</Text>
      </View>

      <View className="flex-1 rounded-2xl border border-neutral-border bg-white p-4">
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCircle2
            size={18}
            color={COLORS.primary.default}
            strokeWidth={2}
          />
        </View>
        <Text className="text-2xl font-bold text-neutral-foreground">
          {deductibleReceipts}
        </Text>
        <Text className="text-neutral-muted mt-0.5 text-xs">Deducibles</Text>
      </View>
    </View>
  );
}
