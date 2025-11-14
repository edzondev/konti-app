import { Home, ReceiptText, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { TabBarIcon } from '@/components/shared/tab-bar-icon';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderRadius: 22,
          position: 'absolute',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          marginHorizontal: 20,
          marginBottom: 20,
          elevation: 3,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: true,
        tabBarItemStyle: {
          marginHorizontal: 8,
          borderRadius: 16,
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused} color={color} size={28} Icon={Home} />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/index"
        options={{
          title: 'Boletas y Facturas',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              Icon={ReceiptText}
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
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused} color={color} size={28} Icon={User} />
          ),
          animation: 'fade',
        }}
      />
    </Tabs>
  );
}
