import { View, Image, useWindowDimensions } from 'react-native';

interface OnboardingIllustrationProps {
  type: 'scan' | 'organize' | 'taxes';
}

export function OnboardingIllustration({ type }: OnboardingIllustrationProps) {
  const { width } = useWindowDimensions();
  const getImageSource = () => {
    switch (type) {
      case 'scan':
        return require('@/assets/images/uploading_file.png');
      case 'organize':
        return require('@/assets/images/files.png');
      case 'taxes':
        return require('@/assets/images/private_files.png');
    }
  };

  return (
    <View className="items-center justify-center">
      <View className="h-64 w-64 items-center justify-center">
        <Image
          source={getImageSource()}
          className="h-full w-full"
          style={{
            width: width * 0.8,
            height: width * 0.8,
          }}
          resizeMode="contain"
          alt={`${type} illustration`}
        />
      </View>
    </View>
  );
}
