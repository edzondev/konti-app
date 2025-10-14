import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { Text, type TextProps } from 'react-native';

type LabelProps = TextProps & {};

const labelVariants = cva('text-lg text-neutral-foreground font-light');

const Label = ({ children, className, ...props }: LabelProps) => {
  return (
    <Text className={cn(labelVariants({ className }))} {...props}>
      {children}
    </Text>
  );
};

Label.displayName = 'Label';

export { Label };
