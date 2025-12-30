import { Request, Response, NextFunction } from 'express'
import { UserChatKeyService } from '../index.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { AUTH, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'

class UserChatKeyController {
    /**
     * Register or update user's chat keys
     * POST /api/chat-key/register
     */
    static async registerKey(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const { publicKey, encryptedPrivateKey, privateKeyNonce, kdfSalt, kdfParams } = req.body

            if (!publicKey) {
                throw new BadRequestError(missingDataField('publicKey'))
            }

            const data = await UserChatKeyService.registerKey(
                userId,
                publicKey,
                encryptedPrivateKey,
                privateKeyNonce,
                kdfSalt,
                kdfParams
            )

            return handleSuccess(res, data, 'Đăng ký chat key thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get all users with chat capability
     * GET /api/chat-key/users
     */
    static async getUsersWithKeys(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user?._id?.toString()
            const data = await UserChatKeyService.getUsersWithKeys(currentUserId)
            return handleSuccess(res, data, 'Lấy danh sách users có chat key thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get user's public key by userId
     * GET /api/chat-key/:userId
     */
    static async getPublicKey(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params
            const data = await UserChatKeyService.getPublicKey(userId)
            return handleSuccess(res, data, 'Lấy public key thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Get encrypted private key for recovery
     * GET /api/chat-key/:userId/encrypted-key
     */
    static async getEncryptedKey(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params
            const data = await UserChatKeyService.getEncryptedKey(userId)
            return handleSuccess(res, data, 'Lấy encrypted key thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * Check if current user has chat key
     * GET /api/chat-key/me
     */
    static async hasMyKey(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const hasKey = await UserChatKeyService.hasKey(userId)
            return handleSuccess(res, { hasKey }, 'Kiểm tra chat key thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default UserChatKeyController
