import { Home, ReceiptText, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          height: 60,
          marginHorizontal: 20,
          marginBottom: Math.max(insets.bottom, 50),
          position: 'absolute',
          shadowRadius: 4,
          elevation: 1,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 12,
          marginHorizontal: 8,
          borderRadius: 16,
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size} />
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
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          animation: 'fade',
        }}
      />
    </Tabs>
  );
}
