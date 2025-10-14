import { Home, ReceiptText, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1f2937', // gray-800
          borderRadius: 9999,
          height: 75,
          marginHorizontal: 36,
          marginBottom: 24,
          position: 'absolute',
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
          marginHorizontal: 20,
          borderRadius: 25,
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/index"
        options={{
          title: 'Boletas',
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size} />
          ),
          animation: 'fade',
        }}
      />
      <Tabs.Screen
        name="receipt/[receiptId]"
        options={{
          title: 'Detalle de boleta',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          animation: 'fade',
        }}
      />
    </Tabs>
  );
}
