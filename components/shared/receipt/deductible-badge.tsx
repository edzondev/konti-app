import React from 'react';
import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface DeductibleBadgeProps {
  isDeductible: boolean | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function DeductibleBadge({
  isDeductible,
  size = 'md',
  showLabel = true,
}: DeductibleBadgeProps) {
  if (isDeductible === null) {
    return null;
  }

  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (isDeductible) {
    return (
      <View
        className={`flex-row items-center gap-1 rounded-full bg-green-100 ${padding}`}
      >
        <Check size={iconSize} color="#15803D" strokeWidth={2.5} />
        {showLabel && (
          <Text className={`font-medium text-green-700 ${textSize}`}>
            Deducible
          </Text>
        )}
      </View>
    );
  }

  return (
    <View
      className={`flex-row items-center gap-1 rounded-full bg-gray-100 ${padding}`}
    >
      <X size={iconSize} color="#6B7280" strokeWidth={2.5} />
      {showLabel && (
        <Text className={`font-medium text-gray-600 ${textSize}`}>
          No deducible
        </Text>
      )}
    </View>
  );
}



