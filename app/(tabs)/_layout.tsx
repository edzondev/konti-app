import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { TabBarIcon } from '@/components/shared/tab-bar-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconHome from '@/assets/icons/icon-home.svg';
import IconReceipt from '@/assets/icons/icon-receipt.svg';
import IconMessage from '@/assets/icons/icon-message.svg';
import IconUser from '@/assets/icons/icon-user.svg';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: insets.bottom + 70,
          paddingTop: 10,
          backgroundColor: COLORS.neutral.white,
        },
        tabBarActiveTintColor: COLORS.primary.default,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              Icon={IconHome}
            />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/index"
        options={{
          title: 'Boletas',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              Icon={IconReceipt}
            />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/[receiptId]"
        options={{
          animation: 'fade',
          href: null,
        }}
      />
      <Tabs.Screen
        name="ask-konti"
        options={{
          title: 'Konti AI',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              Icon={IconMessage}
            />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              Icon={IconUser}
            />
          ),
          animation: 'fade',
        }}
      />
    </Tabs>
  );
}
