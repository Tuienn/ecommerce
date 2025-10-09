import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import { Redirect, Stack } from 'expo-router'
import { View } from 'react-native'

export default function Screen() {
    const { isAuth } = useAuth()

    // useEffect(() => {
    //     const handleRemoveAuth = async () => {
    //         await clearAuthToken()
    //     }

    //     handleRemoveAuth()
    // }, [])

    // If user is not authenticated, redirect to login
    if (!isAuth) {
        return <Redirect href='/(auth)/(login)/login-by-email' />
    }

    return (
        <>
            <Stack.Screen />
            <View className='flex-1 items-center justify-center gap-8 p-4'>
                <Text>Trang chủ</Text>
            </View>
        </>
    )
}
