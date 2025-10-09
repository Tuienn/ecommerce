import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Web fallback using localStorage
const isWeb = Platform.OS === 'web'

const webStorage = {
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value)
        }
    },
    getItem: (key: string): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key)
        }
        return null
    },
    removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key)
        }
    }
}

export const saveRefreshToken = async (token: string) => {
    try {
        if (isWeb) {
            webStorage.setItem('refreshToken', token)
        } else {
            await SecureStore.setItemAsync('refreshToken', token)
        }
    } catch (error) {
        console.error('Error saving refresh token:', error)
        throw error
    }
}

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        if (isWeb) {
            return webStorage.getItem('refreshToken')
        } else {
            return await SecureStore.getItemAsync('refreshToken')
        }
    } catch (error) {
        console.error('Error getting refresh token:', error)
        return null
    }
}

export const saveAccessToken = async (token: string) => {
    try {
        if (isWeb) {
            webStorage.setItem('accessToken', token)
        } else {
            await SecureStore.setItemAsync('accessToken', token)
        }
    } catch (error) {
        console.error('Error saving access token:', error)
        throw error
    }
}

export const getAccessToken = async (): Promise<string | null> => {
    try {
        if (isWeb) {
            return webStorage.getItem('accessToken')
        } else {
            return await SecureStore.getItemAsync('accessToken')
        }
    } catch (error) {
        console.error('Error getting access token:', error)
        return null
    }
}

export const clearAuthToken = async () => {
    try {
        if (isWeb) {
            webStorage.removeItem('refreshToken')
            webStorage.removeItem('accessToken')
        } else {
            await SecureStore.deleteItemAsync('refreshToken')
            await SecureStore.deleteItemAsync('accessToken')
        }
    } catch (error) {
        console.error('Error clearing auth tokens:', error)
        // Don't throw here as this is cleanup
    }
}
