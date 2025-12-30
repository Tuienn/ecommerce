import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

/**
 * Tạo cặp khóa bất đối xứng (Curve25519)
 */
export const generateKeyPair = () => {
    const kp = nacl.box.keyPair()
    return {
        publicKey: naclUtil.encodeBase64(kp.publicKey),
        secretKey: naclUtil.encodeBase64(kp.secretKey)
    }
}

/**
 * Tạo shared key giữa 2 user (ECDH)
 */
export const deriveSharedKey = (theirPublicKey, mySecretKey) => {
    return nacl.box.before(naclUtil.decodeBase64(theirPublicKey), naclUtil.decodeBase64(mySecretKey))
}

export const createNonce = (counter) => {
    const nonce = new Uint8Array(24)
    const random = nacl.randomBytes(16)
    nonce.set(random, 0)

    // 8 byte counter để tránh trùng nonce
    for (let i = 0; i < 8; i++) {
        nonce[23 - i] = (counter >> (i * 8)) & 0xff
    }
    return nonce
}

export const encryptMessage = (plainText, sharedKey, counter) => {
    const nonce = createNonce(counter)
    const messageBytes = naclUtil.decodeUTF8(plainText)

    const encrypted = nacl.secretbox(messageBytes, nonce, sharedKey)

    return {
        encryptedContent: naclUtil.encodeBase64(encrypted),
        nonce: naclUtil.encodeBase64(nonce)
    }
}

export const decryptMessage = (encryptedBase64, nonceBase64, sharedKey) => {
    const encrypted = naclUtil.decodeBase64(encryptedBase64)
    const nonce = naclUtil.decodeBase64(nonceBase64)

    const decrypted = nacl.secretbox.open(encrypted, nonce, sharedKey)
    if (!decrypted) throw new Error('Decrypt failed')

    return naclUtil.encodeUTF8(decrypted)
}

export const generateSalt = () => {
    return nacl.randomBytes(32)
}

export const deriveKeyFromPassword = async (password, salt) => {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, [
        'deriveBits'
    ])

    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations: 100000
        },
        keyMaterial,
        256
    )

    return new Uint8Array(bits)
}

export const encryptPrivateKey = (privateKeyBytes, masterKey) => {
    const nonce = nacl.randomBytes(24)
    const encrypted = nacl.secretbox(privateKeyBytes, nonce, masterKey)

    return {
        encryptedPrivateKey: naclUtil.encodeBase64(encrypted),
        nonce: naclUtil.encodeBase64(nonce)
    }
}

export const decryptPrivateKey = (encryptedBase64, nonceBase64, masterKey) => {
    const encrypted = naclUtil.decodeBase64(encryptedBase64)
    const nonce = naclUtil.decodeBase64(nonceBase64)

    const decrypted = nacl.secretbox.open(encrypted, nonce, masterKey)
    if (!decrypted) throw new Error('Invalid password')

    return decrypted
}
