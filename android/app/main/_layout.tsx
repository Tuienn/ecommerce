import { Tabs } from 'expo-router'
import { ShoppingCart, Package, Home, Settings, HelpCircle } from 'lucide-react-native'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500'
                }
            }}
        >
            <Tabs.Screen
                name='cart/index'
                options={{
                    title: 'Giỏ hàng',
                    tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name='order/index'
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name='home/index'
                options={{
                    title: 'Trang chính',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name='setting/index'
                options={{
                    title: 'Cài đặt',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name='support/index'
                options={{
                    title: 'Hỗ trợ',
                    tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} />
                }}
            />
        </Tabs>
    )
}
