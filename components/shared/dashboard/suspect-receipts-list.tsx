import { View, Text, Pressable } from 'react-native';
import {
  AlertCircle,
  ChevronRight,
  Copy,
  HelpCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import type { SuspectReceipt } from '@/types/ai-extraction.types';

interface SuspectReceiptsListProps {
  data: SuspectReceipt[];
  isLoading?: boolean;
  maxItems?: number;
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return 'S/ -';
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const REASON_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  low_confidence: {
    label: 'Baja confianza',
    color: 'text-amber-600',
    icon: HelpCircle,
  },
  potential_duplicate: {
    label: 'Posible duplicado',
    color: 'text-orange-600',
    icon: Copy,
  },
  unknown: {
    label: 'Requiere revisión',
    color: 'text-gray-600',
    icon: AlertCircle,
  },
};

export function SuspectReceiptsList({
  data,
  isLoading,
  maxItems = 5,
}: SuspectReceiptsListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2].map((i) => (
          <View
            key={i}
            className="mt-3 h-16 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </View>
    );
  }

  const displayedItems = data.slice(0, maxItems);

  if (displayedItems.length === 0) {
    return (
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <AlertCircle size={16} color="#16A34A" strokeWidth={2} />
          </View>
          <Text className="text-base font-semibold text-neutral-foreground">
            Pendientes de Revisión
          </Text>
        </View>
        <View className="mt-4 items-center py-4">
          <Text className="text-sm text-green-600">
            ✓ Todos tus comprobantes están en orden
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle size={16} color="#D97706" strokeWidth={2} />
          </View>
          <Text className="text-base font-semibold text-neutral-foreground">
            Pendientes de Revisión
          </Text>
        </View>
        <View className="rounded-full bg-amber-100 px-2 py-1">
          <Text className="text-xs font-medium text-amber-700">
            {data.length}
          </Text>
        </View>
      </View>

      <View className="mt-3 gap-2">
        {displayedItems.map((receipt) => {
          const reasonInfo =
            REASON_LABELS[receipt.suspect_reason] || REASON_LABELS.unknown;
          const ReasonIcon = reasonInfo.icon;

          return (
            <Pressable
              key={receipt.id}
              onPress={() => router.push(`/receipt/${receipt.id}`)}
              className="flex-row items-center justify-between rounded-xl bg-gray-50 p-3 active:bg-gray-100"
            >
              <View className="flex-1">
                <Text
                  className="text-sm font-medium text-neutral-foreground"
                  numberOfLines={1}
                >
                  {receipt.business_name || 'Sin identificar'}
                </Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <Text className="text-muted text-sm">
                    {formatCurrency(receipt.total_amount)}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <ReasonIcon size={12} color={COLORS.neutral.muted} />
                    <Text className={`text-xs ${reasonInfo.color}`}>
                      {reasonInfo.label}
                    </Text>
                  </View>
                </View>
                {receipt.confidence !== null && (
                  <Text className="text-muted mt-0.5 text-xs">
                    Confianza: {Math.round(receipt.confidence * 100)}%
                  </Text>
                )}
              </View>
              <ChevronRight size={20} color={COLORS.neutral.muted} />
            </Pressable>
          );
        })}
      </View>

      {data.length > maxItems && (
        <Pressable
          onPress={() => router.push('/receipt')}
          className="mt-3 items-center py-2"
        >
          <Text className="text-primary-default text-sm font-medium">
            Ver todos ({data.length})
          </Text>
        </Pressable>
      )}
    </View>
  );
}
