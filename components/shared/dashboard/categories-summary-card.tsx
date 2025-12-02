import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type {
  DeductionByCategory,
  ReceiptCategory,
} from '@/types/ai-extraction.types';

interface CategoriesSummaryCardProps {
  data: DeductionByCategory[];
  isLoading?: boolean;
}

const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  alimentacion: 'Alimentación',
  salud: 'Salud',
  tecnologia: 'Tecnología',
  transporte: 'Transporte',
  educacion: 'Educación',
  servicios: 'Servicios',
  compras_generales: 'Compras',
  alojamiento: 'Alojamiento',
  servicios_profesionales: 'Profesionales',
  seguros: 'Seguros',
  otros: 'Otros',
};

const CATEGORY_COLORS: Record<string, string> = {
  alimentacion: '#10B981',
  salud: '#EF4444',
  tecnologia: '#3B82F6',
  transporte: '#F59E0B',
  educacion: '#8B5CF6',
  servicios: '#6B7280',
  compras_generales: '#EC4899',
  alojamiento: '#14B8A6',
  servicios_profesionales: '#6366F1',
  seguros: '#F97316',
  otros: '#9CA3AF',
};

function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function CategoriesSummaryCard({
  data,
  isLoading,
}: CategoriesSummaryCardProps) {
  if (isLoading) {
    return (
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <View key={i} className="mt-3">
            <View className="h-4 w-full animate-pulse rounded bg-gray-200" />
          </View>
        ))}
      </View>
    );
  }

  const sortedData = [...data]
    .filter((c) => c.total_amount > 0)
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5);

  const maxAmount = sortedData.length > 0 ? sortedData[0].total_amount : 0;
  const totalAmount = sortedData.reduce((sum, c) => sum + c.total_amount, 0);

  if (sortedData.length === 0) {
    return (
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center gap-2">
          <View className="bg-secondary-default/10 h-8 w-8 items-center justify-center rounded-full">
            <PieChart
              size={16}
              color={COLORS.primary.default}
              strokeWidth={2}
            />
          </View>
          <Text className="text-base font-semibold text-neutral-foreground">
            Por Categoría
          </Text>
        </View>
        <Text className="text-muted mt-4 text-center text-sm">
          Sin datos de categorías aún
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="bg-secondary-default/10 h-8 w-8 items-center justify-center rounded-full">
            <PieChart
              size={16}
              color={COLORS.secondary.default}
              strokeWidth={2}
            />
          </View>
          <Text className="text-base font-semibold text-neutral-foreground">
            Por Categoría
          </Text>
        </View>
        <Text className="text-muted text-sm">
          {formatCurrency(totalAmount)}
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {sortedData.map((category) => {
          const percentage =
            maxAmount > 0 ? (category.total_amount / maxAmount) * 100 : 0;
          const color =
            CATEGORY_COLORS[category.category] || CATEGORY_COLORS.otros;
          const label =
            CATEGORY_LABELS[category.category as ReceiptCategory] ||
            category.category;

          return (
            <View key={category.category}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm text-neutral-foreground">{label}</Text>
                <Text className="text-sm font-medium text-neutral-foreground">
                  {formatCurrency(category.total_amount)}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-gray-100">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
              <Text className="text-muted mt-0.5 text-xs">
                {category.receipt_count} comprobante
                {category.receipt_count !== 1 ? 's' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
