import { View, Text } from 'react-native';
import { KPI_CARD_CONFIG } from '@/constants/dashboard';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  config: (typeof KPI_CARD_CONFIG)[number];
  kpis: any;
  isLoading: boolean;
};

export default function KpiCard({ config, kpis, isLoading }: KpiCardProps) {
  const IconComponent = config.icon;

  return (
    <View className="flex-auto rounded-2xl border border-neutral-border p-4">
      <View
        className={cn(
          'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
          config.iconBgColor,
        )}
      >
        <IconComponent color={config.color} size={20} />
      </View>
      <Text
        className="mb-0.5 text-2xl font-semibold text-neutral-foreground"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {isLoading ? '...' : config.getValue(kpis)}
      </Text>
      <Text
        className="text-neutral-muted text-xs font-normal"
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </View>
  );
}
