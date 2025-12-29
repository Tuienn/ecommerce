import { Request, Response, NextFunction } from 'express'
import { ChatService, UserChatKeyService } from '../index.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { AUTH, missingDataField } from '../../constants/text'
import { BadRequestError, ForbiddenError } from '../../exceptions/error.handler'

class ChatController {
    /**
     * Create or get chat between 2 users
     * POST /api/chat/create
     */
    static async createOrGetChat(req: Request, res: Response, next: NextFunction) {
        try {
            const { participantIds } = req.body
            const currentUserId = req.user?._id?.toString()

            if (!currentUserId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            if (!participantIds || !Array.isArray(participantIds)) {
                throw new BadRequestError(missingDataField('participantIds'))
            }

            // Ensure current user is one of the participants
            if (!participantIds.includes(currentUserId)) {
                throw new ForbiddenError('Bạn phải là một trong các participants')
            }

            const chat = await ChatService.createOrGetChat(participantIds)

            // Get public keys for all participants
            const participantsWithKeys = await Promise.all(
                chat.participants.map(async (participant: any) => {
                    try {
                        const keyData = await UserChatKeyService.getPublicKey(participant._id.toString())
                        return {
                            ...(participant.toObject?.() || participant),
                            publicKey: keyData.publicKey
                        }
                    } catch {
                        return participant.toObject?.() || participant
                    }
                })
            )

            const result = {
                ...(chat.toObject?.() || chat),
                participants: participantsWithKeys
            }

            return handleSuccess(res, result, 'Tạo/lấy chat thành công', StatusCodes.OK)
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get current user's chats
     * GET /api/chat/my-chats
     */
    static async getMyChats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const data = await ChatService.getUserChats(userId)
            return handleSuccess(res, data, 'Lấy danh sách chat thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get chat by ID
     * GET /api/chat/:chatId
     */
    static async getChatById(req: Request, res: Response, next: NextFunction) {
        try {
            const { chatId } = req.params
            const userId = req.user?._id?.toString()

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            // Check if user is a participant
            const isParticipant = await ChatService.isParticipant(chatId, userId)
            if (!isParticipant) {
                throw new ForbiddenError('Bạn không phải participant của chat này')
            }

            const data = await ChatService.getChatById(chatId)
            return handleSuccess(res, data, 'Lấy thông tin chat thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default ChatController
