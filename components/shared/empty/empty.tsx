import { View, Text } from 'react-native';
import ImageComponent from '@/components/ui/image';

export default function Empty() {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="flex-col items-center justify-center gap-2">
        <ImageComponent
          src={require('@/assets/images/empty.png')}
          style={{ width: 250, height: 250 }}
          contentFit="contain"
          alt="No hay datos disponibles"
          recyclingKey="no-data"
        />
        <Text className="text-neutral-muted text-center text-base font-normal">
          No hay datos disponibles
        </Text>
      </View>
    </View>
  );
}
