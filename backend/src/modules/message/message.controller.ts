import { Request, Response, NextFunction } from 'express'
import { MessageService, ChatService } from '../index.service'
import { handleSuccess } from '../../utils/handleRes'
import { AUTH } from '../../constants/text'
import { BadRequestError, ForbiddenError } from '../../exceptions/error.handler'

class MessageController {
    /**
     * Get messages for a chat with cursor-based pagination
     * GET /api/message/chat/:chatId
     */
    static async getChatMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const { chatId } = req.params
            const userId = req.user?._id?.toString()

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const limit = parseInt(req.query.limit as string) || 20
            const cursor = req.query.cursor as string | undefined

            // Check if user is a participant of the chat
            const isParticipant = await ChatService.isParticipant(chatId, userId)
            if (!isParticipant) {
                throw new ForbiddenError('Bạn không phải participant của chat này')
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
     * GET /api/message/user/:userId
     */
    static async getUserMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params
            const currentUserId = req.user?._id?.toString()

            if (!currentUserId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const limit = parseInt(req.query.limit as string) || 50
            const cursor = req.query.cursor as string | undefined

            // Users can only get their own messages
            if (userId !== currentUserId) {
                throw new ForbiddenError('Bạn chỉ có thể xem tin nhắn của mình')
            }

            const data = await MessageService.getUserMessages(userId, cursor, limit)
            return handleSuccess(res, data, 'Lấy tin nhắn của user thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default MessageController
