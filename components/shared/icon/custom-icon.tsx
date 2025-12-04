import type { LucideIcon } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';
import { COLORS } from '@/constants/colors';

type CustomIconProps = {
  icon: LucideIcon | ComponentType<SvgProps & { color?: string }>;
  color?: string;
  fill?: string;
  size?: number;
};
export default function CustomIcon({
  icon: Icon,
  color = COLORS.neutral.foreground,
  size = 20,
}: CustomIconProps) {
  return <Icon width={size} height={size} fill={color} />;
}
