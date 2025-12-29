import { Schema, model } from 'mongoose'
import { IMessage } from '../../types/chat'

// Message Schema - encrypted messages
const messageSchema = new Schema<IMessage>({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Server only stores ciphertext, cannot read content
    encryptedContent: {
        type: String, // nacl.secretbox encrypted (base64)
        required: true
    },
    nonce: {
        type: String, // random(16) + counter(8) = 24 bytes (base64)
        required: true
    },
    // Counter for tracking & ensuring no nonce reuse
    messageCounter: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

// Compound Index for querying messages by chatId + sorting by timestamp
// Query pattern: find({ chatId }).sort({ timestamp: -1 })
messageSchema.index({ chatId: 1, timestamp: -1 })

// Index for senderId (to query messages by a user)
messageSchema.index({ senderId: 1 })

// Index for cursor-based pagination: chatId + _id
// Uses _id as cursor because MongoDB auto-generates _id with embedded timestamp
messageSchema.index({ chatId: 1, _id: -1 })

const Message = model<IMessage>('Message', messageSchema)

export default Message
