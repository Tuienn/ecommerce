import { Chat } from '../index.model'
import { BadRequestError, NotFoundError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'

class ChatService {
    /**
     * Create a new chat or get existing chat between 2 users
     */
    static async createOrGetChat(participantIds: string[]) {
        if (!participantIds || participantIds.length !== 2) {
            throw new BadRequestError('Cần đúng 2 participants')
        }

        // Validate ObjectIds
        const validIds = participantIds.every((id) => Types.ObjectId.isValid(id))
        if (!validIds) {
            throw new BadRequestError('Invalid participant IDs')
        }

        // Find existing chat between the 2 users
        let chat = await Chat.findOne({
            participants: { $all: participantIds }
        }).populate('participants', 'name email')

        if (!chat) {
            // Create new chat
            chat = new Chat({
                participants: participantIds
            })
            await chat.save()
            // Populate participants after save
            await chat.populate('participants', 'name email')
        }

        return chat
    }

    /**
     * Get all chats for a user
     */
    static async getUserChats(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID')
        }

        const chats = await Chat.find({
            participants: userId
        })
            .populate('participants', 'name email')
            .sort({ createdAt: -1 })
            .lean()

        return chats
    }

    /**
     * Get chat by ID
     */
    static async getChatById(chatId: string) {
        if (!Types.ObjectId.isValid(chatId)) {
            throw new BadRequestError('Invalid chat ID')
        }

        const chat = await Chat.findById(chatId).populate('participants', 'name email').lean()

        if (!chat) {
            throw new NotFoundError('Chat không tồn tại')
        }

        return chat
    }

    /**
     * Check if user is a participant of the chat
     */
    static async isParticipant(chatId: string, userId: string): Promise<boolean> {
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        }).lean()

        return !!chat
    }
}

export default ChatService
