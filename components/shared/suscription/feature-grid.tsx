import { memo } from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type { Feature } from '@/constants/subscription-features';

type FeatureGridProps = {
  features: Feature[];
};

function FeatureGridItem({ feature }: { feature: Feature }) {
  return (
    <View className="mb-3 flex-row items-center gap-3">
      <View className="bg-secondary-default/10 h-6 w-6 items-center justify-center rounded-full">
        <Check size={12} color={COLORS.secondary.default} strokeWidth={2.5} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900">
          {feature.title}
        </Text>
        {feature.isAvailableInFuture && (
          <View className="bg-warning-light/20 mt-1 self-start rounded-full px-2 py-0.5">
            <Text className="text-warning-dark text-xs font-medium">
              Próximamente
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function FeatureGridComponent({ features }: FeatureGridProps) {
  // Separate current and future features
  const currentFeatures = features.filter((f) => !f.isAvailableInFuture);
  const futureFeatures = features.filter((f) => f.isAvailableInFuture);

  return (
    <View className="px-6">
      {/* Section Header */}
      <View className="mb-5">
        <Text className="text-lg font-bold text-neutral-900">
          Todo lo que incluye
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Accede a todas las funcionalidades premium
        </Text>
      </View>

      {/* Current Features Grid */}
      <View className="mb-6 rounded-2xl bg-neutral-50 p-4">
        {currentFeatures.map((feature, index) => (
          <FeatureGridItem key={feature.title} feature={feature} />
        ))}
      </View>

      {/* Future Features Section */}
      {futureFeatures.length > 0 && (
        <View>
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-px flex-1 bg-neutral-200" />
            <Text className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Próximamente
            </Text>
            <View className="h-px flex-1 bg-neutral-200" />
          </View>

          <View className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-4">
            {futureFeatures.map((feature) => (
              <FeatureGridItem key={feature.title} feature={feature} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export const FeatureGrid = memo(FeatureGridComponent);
