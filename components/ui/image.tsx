import { Image, type ImageProps, type ImageContentFit } from 'expo-image';
import { blurhash } from '@/constants/blur';
import type { ImageSourcePropType } from 'react-native';

type ImageComponentProps = {
  src: ImageSourcePropType | string;
  contentFit?: ImageContentFit;
  transition?: number;
} & ImageProps;

export default function ImageComponent({
  src,
  contentFit = 'cover',
  transition = 1000,
  ...props
}: ImageComponentProps) {
  return (
    <>
      <Image
        source={src}
        placeholder={{ blurhash }}
        contentFit={contentFit}
        transition={transition}
        {...props}
      />
    </>
  );
}
