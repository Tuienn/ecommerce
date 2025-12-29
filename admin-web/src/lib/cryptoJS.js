import CryptoJS from 'crypto-js'
const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET

export const encrypt = (text) => {
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
    } catch (error) {
        console.error('Encryption error:', error)
        return null
    }
}

export const decrypt = (encryptedText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY)
        return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
        console.error('Decryption error:', error)
        return null
    }
}
