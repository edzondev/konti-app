import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUpdates } from '@/hooks/use-updates';

export function UpdateBanner() {
  const {
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    downloadUpdate,
    reloadApp,
  } = useUpdates();

  // Update descargado, listo para aplicar
  if (isUpdatePending) {
    return (
      <View className="bg-blue-500 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="mr-4 flex-1 font-medium text-neutral-white">
            ✅ Actualización lista. Reinicia la app para aplicar los cambios.
          </Text>
          <TouchableOpacity
            onPress={reloadApp}
            className="rounded-lg bg-white px-4 py-2"
          >
            <Text className="font-semibold text-blue-500">Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Update disponible para descargar
  if (isUpdateAvailable) {
    return (
      <View className="bg-green-500 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="mr-4 flex-1 font-medium text-neutral-white">
            📦 Nueva actualización disponible
          </Text>
          <TouchableOpacity
            onPress={downloadUpdate}
            disabled={isDownloading}
            className="flex-row items-center rounded-lg bg-white px-4 py-2 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#10b981"
                  className="mr-2"
                />
                <Text className="font-semibold text-green-500">
                  Descargando...
                </Text>
              </>
            ) : (
              <Text className="font-semibold text-green-500">Descargar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}
