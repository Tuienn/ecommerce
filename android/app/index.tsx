import { useAuth } from '@/hooks/use-auth'
import { Redirect } from 'expo-router'

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

    // If user is authenticated, redirect to main tabs with home as default
    return <Redirect href='/(main)/home' />
}
