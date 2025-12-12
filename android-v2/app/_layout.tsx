import { AuthProvider } from '@/components/providers/auth-provider'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import useAuth from '@/hooks/use-auth'
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

const RootLayoutContent: React.FC = () => {
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

    return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutContent />
        </AuthProvider>
    )
}
