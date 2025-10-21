import { COLORS } from '@/constants/colors';
import { LIMIT_PLANS } from '@/constants/plans';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';
import type { Tables } from '@/types/database.types';
import { Link } from 'expo-router';
import {
  Crown,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import KpiCard from './kpi-card';

export const KPI_CARD_CONFIG = [
  {
    key: 'receipts',
    icon: Receipt,
    color: COLORS.primary,
    bgColor: 'bg-primary/10',
    iconBgColor: 'bg-primary/20',
    label: 'Boletas',
    getValue: (kpis: any) => kpis?.total_receipts ?? 0,
  },
  {
    key: 'total',
    icon: Wallet,
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    iconBgColor: 'bg-emerald-500/20',
    label: 'Total',
    getValue: (kpis: any) => `S/${kpis?.total_amount_sum.toFixed(2) ?? '0.00'}`,
  },
  {
    key: 'expenses',
    icon: TrendingUp,
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    iconBgColor: 'bg-violet-500/20',
    label: 'Contables',
    getValue: (kpis: any) => kpis?.expense_receipts ?? 0,
  },
] as const;

const PLAN_CONFIG = {
  free: { icon: Zap, label: 'Free' },
  pro: { icon: Zap, label: 'Pro' },
  premium: { icon: Crown, label: 'Premium' },
} as const;

type DashboardHeaderProps = {
  data: Tables<'receipts'>[];
};

export default function DashboardHeader({ data }: DashboardHeaderProps) {
  const { currentPlan, hasProOrBetter } = useUserPlan();
  const { data: kpis, isLoading: kpisLoading } = useReceiptKpis();
  const progressWidth = useSharedValue(0);

  const planLimit = LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS];
  const planConfig =
    PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    const getUsagePercentage = () => {
      if (planLimit === Number.POSITIVE_INFINITY) return 0;
      return ((kpis?.total_receipts ?? 0) / planLimit) * 100;
    };

    const percentage = getUsagePercentage();
    progressWidth.value = withTiming(Math.min(percentage, 100), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressWidth, kpis?.total_receipts, planLimit]);

  return (
    <View className="flex-col gap-8 py-4">
      <View className="flex-row items-center justify-between">
        <Image
          source={require('@/assets/konti-logo-hd.jpg')}
          style={{ width: 130, height: 45 }}
          resizeMode="contain"
          alt="Konti"
        />

        {!hasProOrBetter && (
          <Link href="/subscription" asChild className="px-4 py-2">
            <Pressable className="flex-row items-center gap-x-2 rounded-full border border-primary bg-primary/5">
              <Sparkles
                size={14}
                color={COLORS.primary}
                fill={COLORS.primary}
              />
              <Text className="text-base font-semibold text-primary">
                Hazte Pro
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
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <planConfig.icon size={16} color={COLORS.primary} />
            <Text className="text-foreground text-sm font-normal">
              Plan {planConfig.label}
            </Text>
          </View>
          <Text className="text-sm font-light text-neutral-foreground">
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
        {data?.length > 2 && (
          <Link href="/receipt" asChild>
            <Pressable className="rounded-xl">
              <Text className="text-sm font-semibold text-primary">
                Ver todos
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
