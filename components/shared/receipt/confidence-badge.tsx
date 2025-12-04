import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react-native';

interface ConfidenceBadgeProps {
  confidence: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({
  confidence,
  showLabel = true,
  size = 'md',
}: ConfidenceBadgeProps) {
  if (confidence === null) {
    return null;
  }

  const percentage = Math.round(confidence * 100);

  let level: 'high' | 'medium' | 'low';
  let bgColor: string;
  let textColor: string;
  let IconComponent: React.ElementType;

  if (confidence >= 0.8) {
    level = 'high';
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
    IconComponent = CheckCircle;
  } else if (confidence >= 0.5) {
    level = 'medium';
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    IconComponent = AlertCircle;
  } else {
    level = 'low';
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    IconComponent = HelpCircle;
  }

  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  const iconColor =
    level === 'high' ? '#15803D' : level === 'medium' ? '#B45309' : '#B91C1C';

  return (
    <View className={`flex-row items-center gap-1 rounded-full ${bgColor} ${padding}`}>
      <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
      {showLabel && (
        <Text className={`font-medium ${textColor} ${textSize}`}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}



