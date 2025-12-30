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
import { useEffect, useState } from 'react'
import { isUntrustedDevice, getSecurityStatus } from '@/security/check-untrusted-device'
import { isValidSignature } from '@/security/check-signature'
import { Alert, BackHandler } from 'react-native'

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
    const [isSecurityChecked, setIsSecurityChecked] = useState(false)
    const [isSecure, setIsSecure] = useState(false)

    useEffect(() => {
        let isMounted = true

        const checkSecurity = async () => {
            try {
                // 1. Kiểm tra signature của APK (chống repack)
                const validSignature = await isValidSignature()
                if (!isMounted) return

                if (!validSignature) {
                    Alert.alert(
                        'Lỗi bảo mật',
                        'Phát hiện ứng dụng đã bị thay đổi.\nVui lòng tải ứng dụng từ nguồn chính thức.',
                        [
                            {
                                text: 'OK',
                                onPress: () => BackHandler.exitApp()
                            }
                        ],
                        { cancelable: false }
                    )
                    setIsSecurityChecked(true)
                    setIsSecure(false)
                    return
                }

                // 2. Kiểm tra jailbreak/root, mock location, debug mode
                const untrusted = await isUntrustedDevice()
                if (!isMounted) return

                if (untrusted) {
                    const securityStatus = await getSecurityStatus()
                    if (!isMounted) return

                    let message = 'Phát hiện thiết bị không an toàn:\n'

                    if (securityStatus.isJailBroken) {
                        message += '- Thiết bị đã bị jailbreak/root\n'
                    }
                    if (securityStatus.canMockLocation) {
                        message += '- Phát hiện fake GPS\n'
                    }
                    if (securityStatus.isDebuggedMode) {
                        message += '- Ứng dụng đang ở chế độ debug\n'
                    }

                    Alert.alert(
                        'Lỗi bảo mật',
                        message + '\nỨng dụng sẽ thoát để bảo vệ dữ liệu của bạn.',
                        [
                            {
                                text: 'OK',
                                onPress: () => BackHandler.exitApp()
                            }
                        ],
                        { cancelable: false }
                    )
                    setIsSecurityChecked(true)
                    setIsSecure(false)
                    return
                }

                // Tất cả kiểm tra đã pass
                if (isMounted) {
                    setIsSecure(true)
                    setIsSecurityChecked(true)
                }
            } catch (error) {
                console.error('[Security] Error during security check:', error)
                if (isMounted) {
                    // Trong dev mode, cho phép tiếp tục
                    if (__DEV__) {
                        setIsSecure(true)
                    } else {
                        setIsSecure(false)
                    }
                    setIsSecurityChecked(true)
                }
            }
        }

        checkSecurity()

        return () => {
            isMounted = false
        }
    }, [])

    // Không render gì cho đến khi security check hoàn tất
    // Splash screen vẫn hiển thị (preventAutoHideAsync)
    if (!isSecurityChecked || !isSecure) {
        return null
    }

    return (
        <AuthProvider>
            <RootLayoutContent />
        </AuthProvider>
    )
}
