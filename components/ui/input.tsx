import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

type InputProps = TextInputProps & {};

const Input = ({
  className,
  keyboardType,
  secureTextEntry,
  ...props
}: InputProps) => {
  return (
    <TextInput
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      className={cn(
        "h-16 w-full flex-row border-b border-border-default bg-foreground-secondary py-3 text-xl font-medium placeholder:text-gray-400 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
};

export { Input };
