import { useState } from 'react';
import { View, TextInput, type TextInputProps, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/colors';

type PasswordInputProps = TextInputProps & {};

const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="relative">
      <TextInput
        className={cn(
          'placeholder:text-neutral-muted/80 border-b border-neutral-border py-2 pr-10 text-base font-light outline-none',
          className,
        )}
        style={{
          color: COLORS.neutral.foreground,
        }}
        secureTextEntry={!showPassword}
        {...props}
      />
      <Pressable
        onPress={() => setShowPassword(!showPassword)}
        className="absolute right-0 top-0 h-full justify-center px-3"
      >
        {showPassword ? (
          <EyeOff size={20} color={COLORS.neutral.muted} />
        ) : (
          <Eye size={20} color={COLORS.neutral.muted} />
        )}
      </Pressable>
    </View>
  );
};

export { PasswordInput };
