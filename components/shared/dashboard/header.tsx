import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import { Infinity, Sparkles } from 'lucide-react-native';

import { KPI_CARD_CONFIG } from '@/constants/dashboard';
import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';
import KpiCard from './kpi-card';
import { cn } from '@/lib/utils';

export default function DashboardHeader() {
  const {
    kpis,
    kpisLoading,
    isPaidPlan,
    planConfig,
    isUnlimited,
    usedCount,
    planLimit,
    remainingCount,
  } = useDashboardHeader();

  return (
    <View className="flex-col gap-6 py-4">
      <View className="flex-row items-center justify-between">
        <View className="h-12 w-12">
          <Image
            source={require('@/assets/konti_logo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            alt="Konti"
          />
        </View>

        <Link href="/subscription" asChild>
          <Pressable
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-4 py-2',
              isPaidPlan &&
                'border border-secondary bg-violet-100 text-violet-600',
              !isPaidPlan && 'border border-primary/20 bg-primary/5',
            )}
          >
            {isPaidPlan ? (
              <>
                <Sparkles size={14} color="#8b5cf6" />
                <Text className="text-xs font-semibold text-violet-600">
                  {planConfig.label}
                </Text>
              </>
            ) : (
              <Text className="text-sm font-medium text-primary">
                Obtener Pro
              </Text>
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
        <Text className="text-sm text-muted-foreground">
          Boletas subidas (Texto prueba)
        </Text>
        {isUnlimited ? (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-semibold text-violet-600">
              {usedCount}
            </Text>
            <View className="flex-row items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5">
              <Infinity size={12} color="#8b5cf6" />
              <Text className="text-xs font-medium text-violet-600">
                Ilimitado
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-neutral-foreground">
              {usedCount}
              <Text className="font-normal text-muted-foreground">
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
