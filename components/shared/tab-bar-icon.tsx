import type { LucideIcon } from 'lucide-react-native';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  Icon: LucideIcon;
}

export function TabBarIcon({ focused, color, size, Icon }: TabBarIconProps) {
  return <Icon color={color} size={size} strokeWidth={2} absoluteStrokeWidth />;
}
