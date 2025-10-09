import { AuthProvider } from '@/components/provider/auth-provider'
import '@/global.css'
import { NAV_THEME } from '@/lib/theme'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import Toast from 'react-native-toast-message'
import * as SplashScreen from 'expo-splash-screen'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'

// Set the animation options. This is optional.
SplashScreen.setOptions({
    fade: true
})

SplashScreen.preventAutoHideAsync()

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router'

function RootLayoutContent() {
    const { colorScheme } = useColorScheme()
    const { isLoading } = useAuth()

    useEffect(() => {
        const handleSplash = async () => {
            if (!isLoading) {
                // Khi auth đã load xong → ẩn splash
                await SplashScreen.hideAsync()
            }
        }
        handleSplash()
    }, [isLoading])

    if (isLoading) return null

    return (
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }} />
            <PortalHost />
            <Toast />
        </ThemeProvider>
    )
}
export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutContent />
        </AuthProvider>
    )
}
