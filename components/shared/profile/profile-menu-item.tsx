import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

type ProfileMenuItemProps = {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  subtitle?: string;
  badge?: {
    label: string;
    className: string;
  };
  onPress: () => void;
  showBorder?: boolean;
};

export function ProfileMenuItem({
  icon: Icon,
  iconColor = COLORS.neutral.muted,
  label,
  subtitle,
  badge,
  onPress,
  showBorder = false,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'w-full flex-row items-center justify-between px-4 py-6',
        showBorder && 'border-b border-neutral-border',
      )}
    >
      <View className="flex-row items-center gap-3">
        <Icon size={20} color={iconColor} />
        <View className={subtitle ? 'flex-col' : 'flex-row items-center gap-2'}>
          <Text
            className="text-sm font-normal text-neutral-foreground"
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle && (
            <Text className="text-neutral-muted text-xs" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {badge && (
            <Text className={badge.className} numberOfLines={1}>
              {badge.label}
            </Text>
          )}
        </View>
      </View>
      <ChevronRight size={20} color={COLORS.neutral.muted} />
    </Pressable>
  );
}
