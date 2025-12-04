import { View, Text } from 'react-native';
import { Infinity } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';

type PlanCardProps = {
  hasPlus: boolean;
  isUnlimited: boolean;
  usedCount: number;
  planLimit: number;
  remainingCount: number | null;
};

export default function PlanCard({
  hasPlus,
  isUnlimited,
  usedCount,
  planLimit,
  remainingCount,
}: PlanCardProps) {
  const planName = hasPlus ? 'Plan Plus' : 'Plan Básico';
  const isLimitReached = remainingCount !== null && remainingCount === 0;

  return (
    <View
      className={cn(
        'mb-6 rounded-2xl border p-4',
        hasPlus
          ? 'border-secondary-default/30 bg-secondary-default/5'
          : 'border-neutral-border',
      )}
    >
      <View className="flex-col items-start gap-2">
        <Text
          className={cn(
            'text-2xl font-semibold',
            hasPlus ? 'text-secondary-default' : 'text-neutral-foreground',
          )}
        >
          {planName}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text
            className={cn(
              'text-lg font-semibold',
              hasPlus ? 'text-secondary-default' : 'text-neutral-foreground',
            )}
          >
            {usedCount} boletas
            <Text className="text-lg font-normal text-neutral-muted">
              {' '}
              / {isUnlimited ? 'Ilimitado' : planLimit}
            </Text>
          </Text>
          {isLimitReached && (
            <View className="rounded-full bg-destructive-default/15 px-2 py-0.5">
              <Text className="text-sm font-medium text-destructive-default">
                Límite alcanzado
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
