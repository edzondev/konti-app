import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Camera,
  Image as ImageIcon,
  BarChart3,
  Bot,
} from 'lucide-react-native';
import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';
import { useCameraPermission } from '@/hooks/camera/use-camera-permission';
import { useGalleryPicker } from '@/hooks/gallery/use-gallery-picker';
import { COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

type ActionItem = {
  id: string;
  label: string;
  icon: typeof Camera;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function QuickActions() {
  const router = useRouter();
  const { hasPlus } = useDashboardHeader();
  const { handleCameraPress } = useCameraPermission();
  const { handleGalleryPress, isUploading } = useGalleryPicker();

  const actions: ActionItem[] = [
    {
      id: 'camera',
      label: 'Escanear',
      icon: Camera,
      iconColor: COLORS.primary.default,
      onPress: handleCameraPress,
      disabled: isUploading,
    },
    {
      id: 'gallery',
      label: 'Subir',
      icon: ImageIcon,
      iconColor: COLORS.success.default,
      onPress: handleGalleryPress,
      disabled: isUploading,
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      iconColor: COLORS.secondary.default,
      onPress: () => {
        router.push('/reports');
      },
    },
    ...(hasPlus
      ? [
          {
            id: 'ai',
            label: 'Konti AI',
            icon: Bot,
            iconColor: COLORS.secondary.default,
            onPress: () => {
              router.push('/ask-konti');
            },
          } as ActionItem,
        ]
      : []),
  ];

  return (
    <View className="mb-6">
      <Text className="mb-4 text-lg font-semibold text-neutral-foreground">
        Acciones Rápidas
      </Text>
      <View className="flex-row justify-around">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              disabled={action.disabled}
              className="items-center active:opacity-80 disabled:opacity-50"
            >
              <View
                className={cn(
                  'mb-2 h-16 w-16 items-center justify-center rounded-full border border-neutral-border bg-neutral-white',
                )}
              >
                <IconComponent
                  size={24}
                  color={action.iconColor}
                  strokeWidth={2}
                />
              </View>
              <Text className="text-xs font-medium text-neutral-foreground">
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isUploading && (
        <Modal visible={isUploading} onClose={() => {}} transparent>
          <View className="min-h-[50px] min-w-[280px] flex-row items-center justify-center gap-2">
            <Text className="text-lg font-semibold text-neutral-foreground">
              Cargando imagen...
            </Text>
            <ActivityIndicator size="small" color={COLORS.primary.default} />
          </View>
        </Modal>
      )}
    </View>
  );
}
