import { COLORS } from '@/constants/colors';
import { LIMIT_PLANS } from '@/constants/plans';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';
import type { Tables } from '@/types/database.types';
import { useRouter } from 'expo-router';
import {
  Crown,
  Receipt,
  Sparkle,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import ImageComponent from '@/components/ui/image';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type DashboardHeaderProps = {
  data: Tables<'receipts'>[];
};

export default function DashboardHeader({ data }: DashboardHeaderProps) {
  const router = useRouter();
  const { currentPlan, hasProOrBetter } = useUserPlan();
  const { data: kpis, isLoading: kpisLoading } = useReceiptKpis();
  const progressWidth = useSharedValue(0);

  const getUsagePercentage = useCallback(() => {
    const limit = LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS];
    if (limit === Number.POSITIVE_INFINITY) return 0;
    return ((kpis?.total_receipts ?? 0) / limit) * 100;
  }, [kpis, currentPlan]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  useEffect(() => {
    const percentage = getUsagePercentage();
    progressWidth.value = withTiming(Math.min(percentage, 100), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressWidth, getUsagePercentage]);

  return (
    <>
      <View className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <ImageComponent
              src={require('@/assets/images/icon.png')}
              style={{ width: 32, height: 32, borderRadius: 99999 }}
              contentFit="cover"
              alt="Konti"
            />
            <Text className="text-2xl font-semibold text-[#27447b]">Konti</Text>
          </View>

          {!hasProOrBetter && (
            <Pressable
              className="flex-row items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => {
                router.push('/subscription');
              }}
            >
              <Sparkle size={14} color="white" fill="white" />
              <Text className="text-sm font-bold text-white">Suscribete</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="mb-6 mt-4 flex flex-row gap-3">
        <View className="flex-auto rounded-2xl bg-blue-500/10 p-4">
          <View className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Receipt color={'#2563eb'} size={20} />
          </View>
          <Text className="text-foreground mb-0.5 text-2xl font-light">
            {kpisLoading ? '...' : (kpis?.total_receipts ?? 0)}
          </Text>
          <Text className="text-xs font-light text-muted-foreground">
            Boletas
          </Text>
        </View>

        <View className="flex-auto rounded-2xl bg-emerald-500/10 p-4">
          <View className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Wallet color={'#10b981'} size={20} />
          </View>
          <Text className="text-foreground mb-0.5 text-2xl font-light">
            {kpisLoading
              ? '...'
              : `S/${kpis?.total_amount_sum.toFixed(2) ?? '0.00'}`}
          </Text>
          <Text className="text-xs font-light text-muted-foreground">
            Total
          </Text>
        </View>

        <View className="flex-auto rounded-2xl bg-violet-500/10 p-4">
          <View className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <TrendingUp color={'#8b5cf6'} size={20} />
          </View>
          <Text className="text-foreground mb-0.5 text-2xl font-light">
            {kpisLoading ? '...' : (kpis?.expense_receipts ?? 0)}
          </Text>
          <Text className="text-xs font-light text-muted-foreground">
            Contables
          </Text>
        </View>
      </View>

      <View className="mb-6 rounded-2xl bg-primary/5 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {currentPlan === 'free' && <Zap size={16} color={COLORS.primary} />}
            {currentPlan === 'pro' && <Zap size={16} color={COLORS.primary} />}
            {currentPlan === 'premium' && (
              <Crown size={16} color={COLORS.primary} />
            )}
            <Text className="text-foreground text-sm font-normal">
              Plan{' '}
              {currentPlan === 'free'
                ? 'Free'
                : currentPlan === 'pro'
                  ? 'Pro'
                  : 'Premium'}
            </Text>
          </View>
          <Text className="text-sm font-light text-neutral-foreground">
            {kpis?.total_receipts ?? 0} de{' '}
            {LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS] ===
            Number.POSITIVE_INFINITY
              ? '∞'
              : LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS]}{' '}
            boletas
          </Text>
        </View>
        {LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS] !==
          Number.POSITIVE_INFINITY && (
          <View className="h-2 w-full overflow-hidden rounded-full bg-white/50">
            <Animated.View
              className="h-full rounded-full bg-primary"
              style={animatedProgressStyle}
            />
          </View>
        )}
      </View>

      <View className="my-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-muted-foreground">
          Archivos recientes
        </Text>
        {data?.length && data.length > 2 && (
          <Pressable
            className="rounded-xl"
            onPress={() => router.push('/receipts')}
          >
            <Text className="text-sm font-semibold text-primary">
              Ver todos
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );
}
