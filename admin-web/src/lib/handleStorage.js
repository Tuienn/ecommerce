import { decrypt, encrypt } from './cryptoJS'

export const saveDataStorage = (key, data, type = 'local') => {
    let storage = localStorage
    if (type === 'session') {
        storage = sessionStorage
    }
    if (Array.isArray(data) || typeof data === 'object') {
        storage.setItem(key, JSON.stringify(data))
    } else if (data === null || data === undefined) {
        console.error('No data to save into local')
        return
    } else {
        storage.setItem(key, data)
    }
}

export const getDataStorage = (key, type = 'local') => {
    let storage = localStorage
    if (type === 'session') {
        storage = sessionStorage
    }
    const dataStorage = storage.getItem(key)
    if (dataStorage === null) {
        return null
    } else {
        try {
            const data = JSON.parse(dataStorage)
            return data
        } catch {
            return dataStorage
        }
    }
}

export const removeDataStorage = (key, type = 'local') => {
    let storage = localStorage
    if (type === 'session') {
        storage = sessionStorage
    }
    storage.removeItem(key)
}

export const saveAccessToken = (accessToken) => {
    saveDataStorage('accessToken', encrypt(accessToken), 'session')
}

export const getAccessToken = () => {
    const accessToken = getDataStorage('accessToken', 'session')
    return accessToken ? decrypt(accessToken) : null
}

export const saveAuthToken = (refreshToken, data) => {
    // data ở đây là bất cứ dữ liệu gì về user (lưu role, id, ... ở đây)
    saveDataStorage('authToken', encrypt(JSON.stringify({ refreshToken, ...data })), 'local')
}

export const getAuthToken = () => {
    const authToken = getDataStorage('authToken', 'local')
    return authToken ? JSON.parse(decrypt(authToken)) : null
}

export const clearToken = () => {
    removeDataStorage('accessToken', 'session')
    removeDataStorage('authToken', 'local')
    removeDataStorage('secretChatKey', 'session')
}

export const saveSecretChatKey = (secretKey, userId) => {
    saveDataStorage(`secretChatKey`, encrypt(JSON.stringify({ secretKey, userId })), 'session')
}

export const getSecretChatKey = () => {
    const secretKey = getDataStorage(`secretChatKey`, 'session')
    return secretKey ? JSON.parse(decrypt(secretKey)) : null
}

export const clearSecretChatKey = () => {
    removeDataStorage(`secretChatKey`, 'session')
}
