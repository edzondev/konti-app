import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';

type InputProps = TextInputProps & {};

const Input = ({ className, ...props }: InputProps) => {
  return (
    <TextInput
      className={cn(
        'placeholder:text-neutral-muted/80 border-b border-neutral-border py-2 text-base font-light outline-none',
        className,
      )}
      style={{
        color: COLORS.neutral.foreground,
      }}
      {...props}
    />
  );
};

export { Input };
