import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight, Crown, Infinity, Sparkle } from 'lucide-react-native';

import { KPI_CARD_CONFIG } from '@/constants/dashboard';
import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';
import KpiCard from './kpi-card';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';

export default function DashboardHeader() {
  const {
    kpis,
    kpisLoading,
    hasPlus,
    planConfig,
    isUnlimited,
    usedCount,
    planLimit,
    remainingCount,
  } = useDashboardHeader();

  return (
    <View className="my-8 flex-col gap-6">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-3xl font-bold text-neutral-foreground"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Inicio
        </Text>
        <Link href="/subscription" asChild>
          <Pressable
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-4 py-2',
              hasPlus && 'bg-secondary-default/10 text-secondary-default',
              !hasPlus && 'bg-secondary-default/5',
            )}
          >
            {hasPlus ? (
              <>
                <Crown size={14} color={COLORS.secondary.default} />
                <Text className="text-secondary-default text-xs font-semibold">
                  {planConfig.label}
                </Text>
              </>
            ) : (
              <>
                <Sparkle
                  size={14}
                  color={COLORS.secondary.default}
                  fill={COLORS.secondary.default}
                />
                <Text className="text-secondary-default text-sm font-medium">
                  Obtener Plus
                </Text>
              </>
            )}
          </Pressable>
        </Link>
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

      <View className="flex-row items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3">
        <Text className="text-neutral-muted text-sm">
          {hasPlus ? 'Plan Plus activo' : 'Plan Básico activo'}
        </Text>
        {isUnlimited ? (
          <View className="bg-secondary-default/10 flex-row items-center gap-1 rounded-full px-2 py-0.5">
            <Infinity size={12} color={COLORS.secondary.default} />
            <Text className="text-secondary-default text-xs font-medium">
              Ilimitado
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-neutral-foreground">
              {usedCount}
              <Text className="text-neutral-muted font-normal">
                {' '}
                / {planLimit}
              </Text>
            </Text>
            {remainingCount !== null && remainingCount <= 2 && (
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-amber-700">
                  {remainingCount === 0
                    ? 'Límite alcanzado'
                    : `Quedan ${remainingCount}`}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-primary-default text-xl font-semibold">
          Archivos recientes
        </Text>
        <Link href="/receipt" asChild>
          <Pressable className="flex-row items-center gap-1.5">
            <Text className="text-primary-default text-sm font-semibold">
              Ver todos
            </Text>
            <ChevronRight size={16} color={COLORS.primary.default} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
