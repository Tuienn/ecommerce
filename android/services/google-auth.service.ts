import {
    GoogleSignin,
    statusCodes,
    isSuccessResponse,
    isErrorWithCode
} from '@react-native-google-signin/google-signin'
import { GOOGLE_CLIENT_ID } from '@/constants/config'

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        // Web Client ID from Google Cloud Console
        webClientId: GOOGLE_CLIENT_ID,
        // Get offline access for server-side operations
        offlineAccess: true,
        // Force code for refresh token
        forceCodeForRefreshToken: true
    })
}

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        // Check if user has Google Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

        // Perform sign in
        const response = await GoogleSignin.signIn()

        if (isSuccessResponse(response)) {
            const { data } = response
            console.log('Google Sign-In Success!')
            console.log('User Info:', JSON.stringify(data.user, null, 2))
            console.log('ID Token:', data.idToken)
            console.log('Server Auth Code:', data.serverAuthCode)

            return {
                success: true,
                user: data.user,
                idToken: data.idToken,
                serverAuthCode: data.serverAuthCode
            }
        } else {
            console.log('Sign in was cancelled by user')
            return {
                success: false,
                cancelled: true
            }
        }
    } catch (error) {
        if (isErrorWithCode(error)) {
            switch (error.code) {
                case statusCodes.IN_PROGRESS:
                    console.log('Sign in is already in progress')
                    return { success: false, error: 'Đang trong quá trình đăng nhập...' }
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    console.log('Play services not available')
                    return { success: false, error: 'Google Play Services không khả dụng' }
                default:
                    console.log('Google Sign-In Error:', error.code, error.message)
                    return { success: false, error: error.message }
            }
        }
        console.log('Unknown error during Google Sign-In:', error)
        return { success: false, error: 'Đã xảy ra lỗi không xác định' }
    }
}

// Sign out from Google
export const signOutFromGoogle = async () => {
    try {
        await GoogleSignin.signOut()
        console.log('Google Sign-Out Success!')
        return { success: true }
    } catch (error) {
        console.log('Google Sign-Out Error:', error)
        return { success: false, error: 'Đăng xuất thất bại' }
    }
}

// Get current user (if already signed in)
export const getCurrentGoogleUser = async () => {
    try {
        const userInfo = await GoogleSignin.getCurrentUser()
        return userInfo
    } catch (error) {
        console.log('Get current user error:', error)
        return null
    }
}

// Check if user is signed in
export const isGoogleSignedIn = () => {
    return GoogleSignin.hasPreviousSignIn()
}

export default {
    configureGoogleSignIn,
    signInWithGoogle,
    signOutFromGoogle,
    getCurrentGoogleUser,
    isGoogleSignedIn
}
