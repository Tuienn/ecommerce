import { Request, Response, NextFunction } from 'express'
import { MessageService, ChatService } from '../index.service'
import { handleSuccess } from '../../utils/handleRes'
import { AUTH } from '../../constants/text'
import { BadRequestError, ForbiddenError } from '../../exceptions/error.handler'

class MessageController {
    /**
     * Get messages for a chat with cursor-based pagination
     * Admin can access any chat, users can only access their own chats
     * GET /api/message/chat/:chatId
     */
    static async getChatMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const { chatId } = req.params
            const userId = req.user?._id?.toString()
            const userRole = req.user?.role

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const limit = parseInt(req.query.limit as string) || 20
            const cursor = req.query.cursor as string | undefined

            // Admin can access any chat, users need to be participants
            if (userRole !== 'admin') {
                const isParticipant = await ChatService.isParticipant(chatId, userId)
                if (!isParticipant) {
                    throw new ForbiddenError('Bạn không phải participant của chat này')
                }
            }

            const data = await MessageService.getMessages(chatId, cursor, limit)
            return handleSuccess(res, data, 'Lấy tin nhắn thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get messages sent by a user
     * Admin can view any user's messages
     * GET /api/message/user/:userId
     */
    static async getUserMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params
            const currentUserId = req.user?._id?.toString()
            const userRole = req.user?.role

            if (!currentUserId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const limit = parseInt(req.query.limit as string) || 50
            const cursor = req.query.cursor as string | undefined

            // Admin can view any user's messages, users can only view their own
            if (userRole !== 'admin' && userId !== currentUserId) {
                throw new ForbiddenError('Bạn chỉ có thể xem tin nhắn của mình')
            }

            const data = await MessageService.getUserMessages(userId, cursor, limit)
            return handleSuccess(res, data, 'Lấy tin nhắn của user thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get all messages (admin only)
     * GET /api/message/admin/all
     */
    static async getAllMessagesAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(req.query.limit as string) || 50
            const cursor = req.query.cursor as string | undefined

            const data = await MessageService.getAllMessages(cursor, limit)
            return handleSuccess(res, data, 'Lấy tất cả tin nhắn thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default MessageController
