import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { Link, useRouter } from 'expo-router';

type ProfileMenuItemProps = {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
  isSubscription?: boolean;
};

export function ProfileMenuItem({
  icon: Icon,
  iconColor = COLORS.neutral.muted,
  label,
  subtitle,
  onPress,
  showBorder = false,
  isSubscription = false,
}: ProfileMenuItemProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'w-full flex-1 flex-row items-center justify-between px-4 py-6',
        showBorder && 'border-b border-neutral-border',
      )}
    >
      <View className="flex-row items-center gap-3">
        <Icon size={20} color={iconColor} />
        <View
          className={cn(
            'flex-row items-center gap-2',
            subtitle && 'flex-col',
            isSubscription && 'flex-1 justify-between',
          )}
        >
          <Text
            className="text-sm font-normal text-neutral-foreground"
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle && (
            <Text className="text-xs text-neutral-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {isSubscription && (
            <Link href="/subscription">
              <Pressable
                onPress={() => router.push('/subscription')}
                className="rounded-lg bg-secondary-default px-4 py-2"
              >
                <Text className="text-sm font-semibold text-neutral-white">
                  Obtener Plus
                </Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>
      {!isSubscription && (
        <ChevronRight size={20} color={COLORS.neutral.muted} />
      )}
    </Pressable>
  );
}
