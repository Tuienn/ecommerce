import crypto from 'crypto'

// Encrypt function using AES-256-GCM
const encryptString = (plaintext: string, key: string) => {
    const iv = crypto.randomBytes(12) // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    // Format: iv:authTag:encryptedData (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

// Decrypt function using AES-256-GCM
const decryptString = (ciphertext: string, key: string) => {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    return decipher.update(encrypted) + decipher.final('utf8')
}

export const encryptData = (obj: any, masterKey: string): any => {
    if (obj === null || obj === undefined) return obj

    if (typeof obj !== 'object') {
        return encryptString(String(obj), masterKey)
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => encryptData(item, masterKey))
    }

    const encrypted: any = {}

    for (const key of Object.keys(obj)) {
        const value = obj[key]
        const derivedKey = `${masterKey}:${key}`

        if (typeof value === 'object') {
            encrypted[key] = encryptData(value, derivedKey)
        } else {
            encrypted[key] = encryptString(String(value), derivedKey)
        }
    }

    return encrypted
}

export const decryptData = (obj: any, masterKey: string): any => {
    if (obj === null || obj === undefined) return obj

    if (typeof obj === 'string') {
        return decryptString(obj, masterKey)
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => decryptData(item, masterKey))
    }

    if (typeof obj === 'object') {
        const decrypted: any = {}

        for (const key of Object.keys(obj)) {
            const value = obj[key]
            const derivedKey = `${masterKey}:${key}`

            if (typeof value === 'object' && value !== null) {
                decrypted[key] = decryptData(value, derivedKey)
            } else if (typeof value === 'string') {
                decrypted[key] = decryptString(value, derivedKey)
            } else {
                decrypted[key] = value
            }
        }

        return decrypted
    }

    return obj
}
