import { Schema, model } from 'mongoose'
import { IUserChatKey } from '../../types/chat'

const userChatKeySchema = new Schema<IUserChatKey>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        publicKey: {
            type: String, // Base64 encoded nacl.box.keyPair().publicKey
            required: true
        },
        // Password-derived key backup fields
        encryptedPrivateKey: {
            type: String, // Base64 - Private key encrypted by Master Key (derived from password)
            default: null
        },
        privateKeyNonce: {
            type: String, // Base64 - Nonce for nacl.secretbox encryption
            default: null
        },
        kdfSalt: {
            type: String, // Base64 - Salt for KDF (32 bytes)
            default: null
        },
        kdfParams: {
            algorithm: { type: String, default: 'pbkdf2' },
            iterations: { type: Number, default: 600000 },
            hash: { type: String, default: 'SHA-256' }
        }
    },
    {
        timestamps: true
    }
)

const UserChatKey = model<IUserChatKey>('UserChatKey', userChatKeySchema)

export default UserChatKey
