import { Message } from '../index.model'
import { BadRequestError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'

interface PaginatedMessagesResult {
    messages: any[]
    hasMore: boolean
    nextCursor: string | null
}

class MessageService {
    /**
     * Get messages for a chat with cursor-based pagination
     */
    static async getMessages(chatId: string, cursor?: string, limit: number = 20): Promise<PaginatedMessagesResult> {
        if (!Types.ObjectId.isValid(chatId)) {
            throw new BadRequestError('Invalid chat ID')
        }

        const query: any = { chatId }

        // Cursor-based pagination: If cursor exists, get messages older than cursor
        if (cursor && Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: new Types.ObjectId(cursor) } // Get messages with _id < cursor (older)
        }

        // Query with index: { chatId: 1, _id: -1 }
        // Get newest messages first, sorted by _id descending
        const messages = await Message.find(query)
            .sort({ _id: -1 }) // Sort by _id (has embedded timestamp) instead of timestamp
            .limit(limit + 1) // Get 1 extra to check hasMore
            .populate('senderId', 'name email')
            .lean()

        // Check hasMore
        const hasMore = messages.length > limit
        if (hasMore) {
            messages.pop() // Remove extra message
        }

        // nextCursor is _id of the last message
        const nextCursor = messages.length > 0 ? String(messages[messages.length - 1]._id) : null

        return {
            messages,
            hasMore,
            nextCursor
        }
    }

    /**
     * Get messages sent by a specific user (across all chats)
     */
    static async getUserMessages(
        userId: string,
        cursor?: string,
        limit: number = 50
    ): Promise<PaginatedMessagesResult> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID')
        }

        const query: any = { senderId: userId }

        if (cursor && Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: new Types.ObjectId(cursor) }
        }

        // Uses index: { senderId: 1 }
        const messages = await Message.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('senderId', 'name email')
            .populate('chatId', 'participants')
            .lean()

        const hasMore = messages.length > limit
        if (hasMore) {
            messages.pop()
        }

        const nextCursor = messages.length > 0 ? String(messages[messages.length - 1]._id) : null

        return {
            messages,
            hasMore,
            nextCursor
        }
    }

    /**
     * Save a new message (called from socket handler)
     */
    static async saveMessage(
        chatId: string,
        senderId: string,
        encryptedContent: string,
        nonce: string,
        messageCounter: number
    ) {
        const message = new Message({
            chatId,
            senderId,
            encryptedContent,
            nonce,
            messageCounter
        })
        await message.save()

        // Populate sender info
        await message.populate('senderId', 'name email')

        return message
    }
}

export default MessageService
