import { COLORS } from '@/constants/colors';
import { KPI_CARD_CONFIG } from '@/constants/dashboard';
import { Link } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { View, Text, Pressable, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import KpiCard from './kpi-card';
import { cn } from '@/lib/utils';
import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';

export default function DashboardHeader() {
  const {
    kpis,
    kpisLoading,
    hasProOrBetter,
    planLimit,
    planConfig,
    animatedProgressStyle,
  } = useDashboardHeader();

  return (
    <View className="flex-col gap-6 py-4">
      <View className="flex-row items-center justify-between">
        <Image
          source={require('@/assets/konti-logo-hd.jpg')}
          style={{ width: 130, height: 45 }}
          resizeMode="contain"
          alt="Konti"
        />

        {!hasProOrBetter && (
          <Link href="/subscription" asChild>
            <Pressable className="flex-row items-center gap-x-2 rounded-full border border-primary bg-primary/5 px-4 py-2">
              <Sparkles
                size={14}
                color={COLORS.primary}
                fill={COLORS.primary}
              />
              <Text
                className="text-sm font-semibold text-primary"
                numberOfLines={1}
              >
                Suscribirme
              </Text>
            </Pressable>
          </Link>
        )}
      </View>

      <View className="flex flex-row gap-3">
        {KPI_CARD_CONFIG.map((config) => (
          <KpiCard
            key={config.key}
            config={config}
            kpis={kpis}
            isLoading={kpisLoading}
          />
        ))}
      </View>

      <View className="rounded-2xl bg-primary/5 p-4">
        <View
          className={cn(
            'flex-row items-center justify-between',
            planLimit !== Number.POSITIVE_INFINITY && 'mb-3',
          )}
        >
          <View className="flex-row items-center gap-2">
            <planConfig.icon size={16} color={COLORS.primary} />
            <Text className="text-foreground text-sm font-normal">
              Plan {planConfig.label}
            </Text>
          </View>
          <Text
            className="text-sm font-normal text-muted-foreground"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {kpis?.total_receipts ?? 0} de{' '}
            {planLimit === Number.POSITIVE_INFINITY ? '∞' : planLimit} boletas
          </Text>
        </View>
        {planLimit !== Number.POSITIVE_INFINITY && (
          <View className="h-2 w-full overflow-hidden rounded-full bg-white/50">
            <Animated.View
              className="h-full rounded-full bg-primary"
              style={animatedProgressStyle}
            />
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-muted-foreground">
          Archivos recientes
        </Text>
        <Link href="/receipt" asChild>
          <Pressable className="rounded-xl">
            <Text className="text-sm font-semibold text-primary">
              Ver todos
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
