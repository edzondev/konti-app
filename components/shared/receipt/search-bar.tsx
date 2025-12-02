import { View, TextInput, Pressable } from 'react-native';
import { Search, XCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Buscar por empresa, RUC o N° boleta',
}: SearchBarProps) {
  return (
    <View className="relative mb-4">
      <View
        className="absolute left-4 top-1/2 z-10"
        style={{ transform: [{ translateY: -10 }] }}
      >
        <Search color={COLORS.neutral.muted} size={20} />
      </View>
      <TextInput
        keyboardType="default"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="bg-muted/30 h-14 w-full rounded-xl border border-neutral-border py-3 pl-12 pr-4 text-sm font-light outline-none"
        placeholderTextColor={COLORS.neutral.muted}
      />
      {value && (
        <View
          className="absolute right-0 top-1/2 z-10 flex-row items-center justify-center px-4 py-2"
          style={{ transform: [{ translateY: -16 }] }}
        >
          <Pressable onPress={onClear}>
            <XCircle size={20} color={COLORS.neutral.muted} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

