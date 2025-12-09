import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Sparkle } from 'lucide-react-native';

import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';

export default function DashboardHeader() {
  const { hasPlus } = useDashboardHeader();

  return (
    <View className="my-8">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-3xl font-bold text-neutral-foreground"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Inicio
        </Text>
        {!hasPlus && (
          <View className="flex-row items-center gap-3">
            <Link href="/subscription" asChild>
              <Pressable
                className={cn(
                  'flex-row items-center gap-1.5 rounded-full px-4 py-2',
                )}
              >
                <Sparkle
                  size={14}
                  color={COLORS.secondary.default}
                  fill={COLORS.secondary.default}
                />
                <Text className="text-sm font-medium text-secondary-default">
                  Obtener Plus
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>
    </View>
  );
}
