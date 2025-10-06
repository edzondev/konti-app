import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

type InputProps = TextInputProps & {};

const Input = ({ className, ...props }: InputProps) => {
  return (
    <TextInput
      className={cn(
        "border-b border-neutral-border py-2 text-base font-light outline-none placeholder:text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
};

export { Input };
