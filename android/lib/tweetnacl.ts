import 'react-native-get-random-values' // Polyfill cho crypto.getRandomValues()
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { PBKDF2_ITERATIONS } from '@/constants/common'

/**
 * Tạo cặp khóa bất đối xứng (Curve25519)
 */
export const generateKeyPair = (): { publicKey: string; secretKey: string } => {
    const kp = nacl.box.keyPair()
    return {
        publicKey: naclUtil.encodeBase64(kp.publicKey),
        secretKey: naclUtil.encodeBase64(kp.secretKey)
    }
}

/**
 * Tạo shared key giữa 2 user (ECDH)
 */
export const deriveSharedKey = (theirPublicKey: string, mySecretKey: string): Uint8Array => {
    return nacl.box.before(naclUtil.decodeBase64(theirPublicKey), naclUtil.decodeBase64(mySecretKey))
}

export const createNonce = (counter: number): Uint8Array => {
    const nonce = new Uint8Array(24)
    const random = nacl.randomBytes(16)
    nonce.set(random, 0)

    // 8 byte counter để tránh trùng nonce
    for (let i = 0; i < 8; i++) {
        nonce[23 - i] = (counter >> (i * 8)) & 0xff
    }
    return nonce
}

export const encryptMessage = (
    plainText: string,
    sharedKey: Uint8Array,
    counter: number
): { encryptedContent: string; nonce: string } => {
    const nonce = createNonce(counter)
    const messageBytes = naclUtil.decodeUTF8(plainText)

    const encrypted = nacl.secretbox(messageBytes, nonce, sharedKey)

    return {
        encryptedContent: naclUtil.encodeBase64(encrypted),
        nonce: naclUtil.encodeBase64(nonce)
    }
}

export const decryptMessage = (encryptedBase64: string, nonceBase64: string, sharedKey: Uint8Array): string => {
    const encrypted = naclUtil.decodeBase64(encryptedBase64)
    const nonce = naclUtil.decodeBase64(nonceBase64)

    const decrypted = nacl.secretbox.open(encrypted, nonce, sharedKey)
    if (!decrypted) throw new Error('Decrypt failed')

    return naclUtil.encodeUTF8(decrypted)
}

export const generateSalt = (): Uint8Array => {
    return nacl.randomBytes(32)
}

export const deriveKeyFromPassword = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
    // Sử dụng PBKDF2 giống như admin-web để đảm bảo tương thích
    // PBKDF2 với SHA-256, 600000 iterations, output 256 bits (32 bytes)
    const passwordBytes = new TextEncoder().encode(password)
    const derivedKey = pbkdf2(sha256, passwordBytes, salt, {
        c: PBKDF2_ITERATIONS, // iterations - giống admin-web
        dkLen: 32 // output length: 32 bytes = 256 bits
    })

    return new Uint8Array(derivedKey)
}

export const encryptPrivateKey = (
    privateKeyBytes: Uint8Array,
    masterKey: Uint8Array
): { encryptedPrivateKey: string; nonce: string } => {
    const nonce = nacl.randomBytes(24)
    const encrypted = nacl.secretbox(privateKeyBytes, nonce, masterKey)

    return {
        encryptedPrivateKey: naclUtil.encodeBase64(encrypted),
        nonce: naclUtil.encodeBase64(nonce)
    }
}

export const decryptPrivateKey = (encryptedBase64: string, nonceBase64: string, masterKey: Uint8Array): Uint8Array => {
    const encrypted = naclUtil.decodeBase64(encryptedBase64)
    const nonce = naclUtil.decodeBase64(nonceBase64)

    const decrypted = nacl.secretbox.open(encrypted, nonce, masterKey)
    if (!decrypted) throw new Error('Invalid password')

    return decrypted
}
