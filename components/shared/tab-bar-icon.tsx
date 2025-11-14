import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  Icon: LucideIcon;
}

export function TabBarIcon({ focused, color, size, Icon }: TabBarIconProps) {
  return (
    <View className="items-center justify-center">
      <Icon color={color} size={size} strokeWidth={1.5} />
    </View>
  );
}
