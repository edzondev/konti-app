import React from 'react';
import { View, Text } from 'react-native';
import {
  Utensils,
  Heart,
  Monitor,
  Car,
  GraduationCap,
  Zap,
  ShoppingCart,
  Building2,
  Briefcase,
  Shield,
  HelpCircle,
} from 'lucide-react-native';
import type { ReceiptCategory } from '@/types/ai-extraction.types';

interface CategoryTagProps {
  category: ReceiptCategory | string | null;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  alimentacion: {
    label: 'Alimentación',
    icon: Utensils,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: '#15803D',
  },
  salud: {
    label: 'Salud',
    icon: Heart,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: '#B91C1C',
  },
  tecnologia: {
    label: 'Tecnología',
    icon: Monitor,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: '#1D4ED8',
  },
  transporte: {
    label: 'Transporte',
    icon: Car,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    iconColor: '#B45309',
  },
  educacion: {
    label: 'Educación',
    icon: GraduationCap,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    iconColor: '#7C3AED',
  },
  servicios: {
    label: 'Servicios',
    icon: Zap,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: '#374151',
  },
  compras_generales: {
    label: 'Compras',
    icon: ShoppingCart,
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    iconColor: '#BE185D',
  },
  alojamiento: {
    label: 'Alojamiento',
    icon: Building2,
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    iconColor: '#0F766E',
  },
  servicios_profesionales: {
    label: 'Profesionales',
    icon: Briefcase,
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    iconColor: '#4338CA',
  },
  seguros: {
    label: 'Seguros',
    icon: Shield,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    iconColor: '#C2410C',
  },
  otros: {
    label: 'Otros',
    icon: HelpCircle,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    iconColor: '#6B7280',
  },
};

export function CategoryTag({
  category,
  size = 'md',
  showIcon = true,
}: CategoryTagProps) {
  const config = CATEGORY_CONFIG[category || 'otros'] || CATEGORY_CONFIG.otros;
  const IconComponent = config.icon;

  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  return (
    <View
      className={`flex-row items-center rounded-full ${config.bgColor} ${padding} ${gap}`}
    >
      {showIcon && (
        <IconComponent
          size={iconSize}
          color={config.iconColor}
          strokeWidth={2}
        />
      )}
      <Text className={`font-medium ${config.textColor} ${textSize}`}>
        {config.label}
      </Text>
    </View>
  );
}



