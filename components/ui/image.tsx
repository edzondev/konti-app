import { Image, type ImageProps, type ImageContentFit } from 'expo-image';
import { blurhash } from '@/constants/blur';
import type { ImageSourcePropType } from 'react-native';

type ImageComponentProps = {
  src: ImageSourcePropType | string;
  contentFit?: ImageContentFit;
  transition?: number;
  recyclingKey?: string;
  placeholder?: boolean;
} & ImageProps;

export default function ImageComponent({
  src,
  contentFit = 'cover',
  transition = 1000,
  recyclingKey,
  placeholder,
  ...props
}: ImageComponentProps) {
  return (
    <>
      <Image
        source={src}
        placeholder={{ blurhash: placeholder ? blurhash : undefined }}
        contentFit={contentFit}
        transition={transition}
        recyclingKey={recyclingKey}
        {...props}
      />
    </>
  );
}
