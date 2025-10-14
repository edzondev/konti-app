import { View, Text } from 'react-native';
import ImageComponent from '@/components/ui/image';

export default function Empty() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ height: 300 }}
    >
      <View className="flex-col items-center justify-center">
        <ImageComponent
          src={require('@/assets/images/no_data.png')}
          style={{ width: 96, height: 96 }}
          contentFit="contain"
          alt="No hay datos disponibles"
        />
        <Text className="text-center text-base font-light text-muted-foreground">
          No hay datos disponibles
        </Text>
      </View>
    </View>
  );
}
