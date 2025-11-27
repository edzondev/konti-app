import { memo } from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/constants/colors';
import type { Feature } from '@/constants/subscription-features';

interface FeatureItemProps {
  feature: Feature;
}

function FeatureItemComponent({ feature }: FeatureItemProps) {
  const Icon = feature.icon;

  return (
    <View className="mx-6 mb-4 flex-row items-start gap-4 rounded-2xl bg-neutral-50 p-4">
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
        <Icon size={24} color={COLORS.secondary} />
      </View>
      <View className="flex-1">
        <Text className="mb-1 text-base font-bold text-neutral-900">
          {feature.title}
        </Text>
        {feature.isAvailableInFuture ? (
          <Text className="text-sm leading-5 text-muted-foreground">
            Proximamente
          </Text>
        ) : (
          <Text className="text-sm leading-5 text-neutral-600">
            {feature.description}
          </Text>
        )}
      </View>
    </View>
  );
}

export const FeatureItem = memo(FeatureItemComponent);

