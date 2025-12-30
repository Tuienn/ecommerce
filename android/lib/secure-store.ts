import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Xác định đang chạy web hay native
const isWeb = Platform.OS === 'web'

// Web fallback using localStorage
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

/**
 * Hàm lưu dữ liệu
 */
export const saveDataStorage = async (key: string, value: string) => {
    try {
        if (isWeb) {
            webStorage.setItem(key, value)
        } else {
            await SecureStore.setItemAsync(key, value)
        }
    } catch (error) {
        console.error(`Error saving data [${key}]:`, error)
        throw error
    }
}

/**
 * Hàm lấy dữ liệu
 */
export const getDataStorage = async (key: string): Promise<string | null> => {
    try {
        if (isWeb) {
            return webStorage.getItem(key)
        } else {
            return await SecureStore.getItemAsync(key)
        }
    } catch (error) {
        console.error(`Error getting data [${key}]:`, error)
        return null
    }
}

/**
 * Hàm xóa dữ liệu
 */
export const removeDataStorage = async (key: string) => {
    try {
        if (isWeb) {
            webStorage.removeItem(key)
        } else {
            await SecureStore.deleteItemAsync(key)
        }
    } catch (error) {
        console.error(`Error removing data [${key}]:`, error)
    }
}

// ================== Token-specific helpers ================== //

export const saveAccessToken = (token: string) => saveDataStorage('accessToken', token)
export const getAccessToken = () => getDataStorage('accessToken')
export const saveRefreshToken = (token: string) => saveDataStorage('refreshToken', token)
export const getRefreshToken = () => getDataStorage('refreshToken')

export const clearAuthToken = async () => {
    await removeDataStorage('accessToken')
    await removeDataStorage('refreshToken')
    await clearSecretChatKey()
}

export const saveSecretChatKey = async (secretKey: string, oderId: string) => {
    const data = JSON.stringify({ secretKey, oderId })
    await saveDataStorage('secretChatKey', data)
}

export const getSecretChatKey = async (): Promise<{ secretKey: string; oderId: string } | null> => {
    const data = await getDataStorage('secretChatKey')
    if (!data) return null
    try {
        return JSON.parse(data)
    } catch {
        return null
    }
}

export const clearSecretChatKey = async () => {
    await removeDataStorage('secretChatKey')
}
