import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';

interface UpdateInfo {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  error: Error | null;
}

/**
 * Hook para manejar OTA updates de Expo
 *
 * Features:
 * - Verificar updates disponibles
 * - Descargar updates
 * - Aplicar updates (reload)
 * - Estado de carga y errores
 *
 * Usage:
 * ```tsx
 * const { isUpdateAvailable, downloadUpdate, reloadApp } = useUpdates();
 * ```
 */
export function useUpdates() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdateAvailable: false,
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
    error: null,
  });

  const checkForUpdates = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, isChecking: true, error: null }));

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: true,
          isChecking: false,
        }));
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          isChecking: false,
        }));
      }
    } catch (error) {
      setUpdateInfo((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
        isChecking: false,
      }));
    }
  };

  const downloadUpdate = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, isDownloading: true, error: null }));

      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdatePending: true,
          isDownloading: false,
        }));
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isDownloading: false,
        }));
      }
    } catch (error) {
      setUpdateInfo((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
        isDownloading: false,
      }));
    }
  };

  const reloadApp = async () => {
    await Updates.reloadAsync();
  };

  useEffect(() => {
    // La verificación automática se maneja por la configuración en app.json
    // (checkAutomatically: "ON_LOAD")
    // Este hook solo se usa para verificación manual si es necesario
  }, []);

  return {
    ...updateInfo,
    checkForUpdates,
    downloadUpdate,
    reloadApp,
  };
}

