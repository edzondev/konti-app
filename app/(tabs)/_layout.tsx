import { Home, ReceiptText, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { TabBarIcon } from '@/components/shared/tab-bar-icon';

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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              IconOutline={Home}
              IconFilled={Home}
            />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              IconOutline={ReceiptText}
              IconFilled={ReceiptText}
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={28}
              IconOutline={User}
              IconFilled={User}
            />
          ),
          animation: 'fade',
        }}
      />
    </Tabs>
  );
}
