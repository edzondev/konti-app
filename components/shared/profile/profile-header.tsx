import { useMemo } from 'react';
import { View, Text } from 'react-native';

type ProfileHeaderProps = {
  name?: string;
  email?: string;
};

export function ProfileHeader({ name, email }: ProfileHeaderProps) {
  const initials = useMemo(() => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  }, [name]);

  return (
    <View className="mb-8 flex-row items-center gap-4">
      <View className="overflow-hidden rounded-full">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-secondary-default">
          <Text className="text-4xl font-bold text-neutral-white">
            {initials}
          </Text>
        </View>
      </View>
      <View>
        <View className="mb-1 w-[200px]">
          <Text
            className="text-left text-2xl font-bold tracking-tight text-neutral-foreground"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {name}
          </Text>
        </View>

        <View className="mt-1 rounded-full bg-neutral-100 px-4 py-1.5">
          <Text
            className="text-center text-sm text-neutral-muted"
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
      </View>
    </View>
  );
}
