import { View, Text } from 'react-native';
import ImageComponent from '@/components/ui/image';

export default function Empty() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ height: 400 }}
    >
      <View className="flex-col items-center justify-center">
        <ImageComponent
          src={require('@/assets/images/empty.png')}
          style={{ width: 300, height: 300 }}
          contentFit="contain"
          alt="No hay datos disponibles"
          recyclingKey="no-data"
        />
        <Text className="text-center text-lg font-normal text-muted-foreground">
          Oops! Parece que no hay nada aquí
        </Text>
      </View>
    </View>
  );
}
