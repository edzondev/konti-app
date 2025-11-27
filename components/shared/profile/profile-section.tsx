import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

type ProfileSectionProps = {
  title: string;
  children: ReactNode;
};

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View className="mb-8">
      <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
        {children}
      </View>
    </View>
  );
}

