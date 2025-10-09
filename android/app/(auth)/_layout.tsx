import { useAuth } from '@/hooks/use-auth'
import { Redirect, Stack } from 'expo-router'

export default function AuthLayout() {
    const { isAuth } = useAuth()

    // If user is already authenticated, redirect to home
    if (isAuth) {
        return <Redirect href='/' />
    }

    return (
        <Stack>
            <Stack.Screen name='(login)/login-by-email' />
            <Stack.Screen name='(register)/register-by-email' />
        </Stack>
    )
}
