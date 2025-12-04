import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  Icon: ComponentType<SvgProps & { color?: string }>;
}

export function TabBarIcon({ focused, color, size, Icon }: TabBarIconProps) {
  return <Icon width={size} height={size} stroke={color} fill="none" />;
}
