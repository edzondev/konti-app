import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId
  );
}

async function registerForPushNotifications() {
  await setupAndroidChannel();

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.warn('Push notification permission denied');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.error('Project ID not found');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification>();

  useEffect(() => {
    registerForPushNotifications().then(setExpoPushToken);

    const notificationListener =
      Notifications.addNotificationReceivedListener(setNotification);

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) =>
        console.log('Notification tapped:', response),
      );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return { expoPushToken, notification };
}
