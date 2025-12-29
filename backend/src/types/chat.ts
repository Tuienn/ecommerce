import { Document, Types } from 'mongoose'

/**
 * KDF Parameters for password-derived key
 */
export interface IKdfParams {
    algorithm: string
    iterations: number
    hash: string
}

/**
 * User Chat Key Interface - stores user's E2E chat keys
 */
export interface IUserChatKey extends Document {
    _id: Types.ObjectId
    userId: Types.ObjectId
    publicKey: string // Base64 encoded nacl.box.keyPair().publicKey
    encryptedPrivateKey?: string | null // Base64 - Private key encrypted by Master Key
    privateKeyNonce?: string | null // Base64 - Nonce for nacl.secretbox encryption
    kdfSalt?: string | null // Base64 - Salt for KDF (32 bytes)
    kdfParams?: IKdfParams
    createdAt: Date
    updatedAt: Date
}

/**
 * Chat Interface - conversation between users
 */
export interface IChat extends Document {
    _id: Types.ObjectId
    participants: Types.ObjectId[]
    createdAt: Date
}

/**
 * Message Interface - encrypted messages
 */
export interface IMessage extends Document {
    _id: Types.ObjectId
    chatId: Types.ObjectId
    senderId: Types.ObjectId
    encryptedContent: string // nacl.secretbox encrypted (base64)
    nonce: string // random(16) + counter(8) = 24 bytes (base64)
    messageCounter: number // Counter for nonce uniqueness
    timestamp: Date
}
