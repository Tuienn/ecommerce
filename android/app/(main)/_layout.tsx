import { Tabs } from 'expo-router'
import { ShoppingCart, Package, Home, User, MessageCircleMore } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TabLayout() {
    return (
        <SafeAreaView className='flex-1'>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#16a34a',
                    tabBarInactiveTintColor: '#6b7280',
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#ffffff',
                        borderTopWidth: 1,
                        borderTopColor: '#e5e7eb',
                        paddingBottom: 5,
                        paddingTop: 5,
                        height: 60,
                        elevation: 0, // <-- loại bỏ shadow Android
                        shadowOpacity: 0, // <-- loại bỏ shadow iOS
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 0
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
                        title: 'Cá nhân',
                        tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                    }}
                />
                <Tabs.Screen
                    name='chat/index'
                    options={{
                        title: 'Hỗ trợ',
                        tabBarIcon: ({ color, size }) => <MessageCircleMore color={color} size={size} />
                    }}
                />
            </Tabs>
        </SafeAreaView>
    )
}
