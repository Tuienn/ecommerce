import { UserChatKey, User } from '../index.model'
import { NotFoundError, BadRequestError } from '../../exceptions/error.handler'
import { IKdfParams } from '../../types/chat'

class UserChatKeyService {
    /**
     * Register or update user's chat keys
     */
    static async registerKey(
        userId: string,
        publicKey: string,
        encryptedPrivateKey?: string | null,
        privateKeyNonce?: string | null,
        kdfSalt?: string | null,
        kdfParams?: IKdfParams
    ) {
        if (!userId || !publicKey) {
            throw new BadRequestError('userId và publicKey là bắt buộc')
        }

        // Check if user exists
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('User không tồn tại')
        }

        // Create or update chat key
        const chatKey = await UserChatKey.findOneAndUpdate(
            { userId },
            {
                userId,
                publicKey,
                encryptedPrivateKey: encryptedPrivateKey || null,
                privateKeyNonce: privateKeyNonce || null,
                kdfSalt: kdfSalt || null,
                kdfParams: kdfParams || undefined
            },
            { upsert: true, new: true }
        )

        return {
            _id: chatKey._id,
            userId: chatKey.userId,
            publicKey: chatKey.publicKey,
            hasBackup: !!chatKey.encryptedPrivateKey
        }
    }

    /**
     * Get user's public key for key exchange
     */
    static async getPublicKey(userId: string) {
        const chatKey = await UserChatKey.findOne({ userId }).lean()
        if (!chatKey) {
            throw new NotFoundError('User chưa đăng ký chat key')
        }

        return {
            userId: chatKey.userId,
            publicKey: chatKey.publicKey
        }
    }

    /**
     * Get encrypted private key for recovery on new device
     */
    static async getEncryptedKey(userId: string) {
        const chatKey = await UserChatKey.findOne({ userId }).lean()

        if (!chatKey) {
            throw new NotFoundError('User chưa đăng ký chat key')
        }

        if (!chatKey.encryptedPrivateKey) {
            throw new NotFoundError('Không tìm thấy backup key')
        }

        return {
            encryptedPrivateKey: chatKey.encryptedPrivateKey,
            privateKeyNonce: chatKey.privateKeyNonce,
            kdfSalt: chatKey.kdfSalt,
            kdfParams: chatKey.kdfParams,
            publicKey: chatKey.publicKey
        }
    }

    /**
     * Get all users who have registered chat keys
     */
    static async getUsersWithKeys(excludeUserId?: string) {
        const query = excludeUserId ? { userId: { $ne: excludeUserId } } : {}

        const chatKeys = await UserChatKey.find(query).populate('userId', 'name email').lean()

        return chatKeys.map((key) => ({
            _id: key._id,
            userId: key.userId,
            publicKey: key.publicKey
        }))
    }

    /**
     * Check if user has registered chat key
     */
    static async hasKey(userId: string): Promise<boolean> {
        const chatKey = await UserChatKey.findOne({ userId }).lean()
        return !!chatKey
    }
}

export default UserChatKeyService
