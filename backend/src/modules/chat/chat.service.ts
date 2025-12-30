import { Chat, User } from '../index.model'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'
import { UserRole } from '../../types/user'

class ChatService {
    /**
     * Validate that at least one participant is admin
     * @returns true if validation passed
     */
    static async validateChatParticipants(participantIds: string[]): Promise<boolean> {
        const users = await User.find({
            _id: { $in: participantIds }
        })
            .select('role')
            .lean()

        if (users.length !== participantIds.length) {
            throw new BadRequestError('Một hoặc nhiều participant không tồn tại')
        }

        const hasAdmin = users.some((user) => user.role === 'admin')
        return hasAdmin
    }

    /**
     * Create a new chat or get existing chat between 2 users
     * At least one participant must be admin
     */
    static async createOrGetChat(participantIds: string[], _currentUserRole: UserRole) {
        if (!participantIds || participantIds.length !== 2) {
            throw new BadRequestError('Cần đúng 2 participants')
        }

        // Validate ObjectIds
        const validIds = participantIds.every((id) => Types.ObjectId.isValid(id))
        if (!validIds) {
            throw new BadRequestError('Invalid participant IDs')
        }

        // Check if at least one participant is admin
        const hasAdmin = await this.validateChatParticipants(participantIds)
        if (!hasAdmin) {
            throw new ForbiddenError('Chỉ có thể tạo chat giữa admin và user. User không thể chat với user khác.')
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
     * Get all chats (admin only)
     */
    static async getAllChats() {
        const chats = await Chat.find({}).populate('participants', 'name email role').sort({ createdAt: -1 }).lean()

        return chats
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
