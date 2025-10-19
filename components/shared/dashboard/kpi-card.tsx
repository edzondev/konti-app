import { View, Text } from 'react-native';
import { KPI_CARD_CONFIG } from './header';

type KpiCardProps = {
  config: (typeof KPI_CARD_CONFIG)[number];
  kpis: any;
  isLoading: boolean;
};

export default function KpiCard({ config, kpis, isLoading }: KpiCardProps) {
  const IconComponent = config.icon;

  return (
    <View className={`flex-auto rounded-2xl ${config.bgColor} p-4`}>
      <View
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBgColor}`}
      >
        <IconComponent color={config.color} size={20} />
      </View>
      <Text className="text-foreground mb-0.5 text-2xl font-light">
        {isLoading ? '...' : config.getValue(kpis)}
      </Text>
      <Text className="text-xs font-light text-muted-foreground">
        {config.label}
      </Text>
    </View>
  );
}
