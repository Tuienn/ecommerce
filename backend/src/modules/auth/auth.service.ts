import { User, Auth } from '../index.model'
import {
    NotFoundError,
    AuthFailureError,
    ForbiddenError,
    OtpError,
    ConflictRequestError
} from '../../exceptions/error.handler'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/handleJwt'
import { OTPService, UserService } from '../index.service'
import { AUTH } from '../../constants/text'

class AuthService {
    static async loginByEmail(email: string, password: string) {
        const user = await User.findOne({ email }).select('+password')

        if (!user) {
            throw new AuthFailureError(AUTH.INVALID_ACCOUNT)
        }

        if (user.isActive === false) {
            throw new ForbiddenError(AUTH.ACCOUNT_DISABLED)
        }

        const isValidPassword = await user.comparePassword(password)
        if (!isValidPassword) {
            throw new AuthFailureError(AUTH.INVALID_ACCOUNT)
        }

        const tokenPayload = {
            userId: user._id,
            email: user.email,
            role: user.role
        }

        const accessToken = generateAccessToken(tokenPayload)
        const refreshToken = generateRefreshToken({ userId: user._id })

        await Auth.findOneAndUpdate({ user: user._id }, { refreshToken, revokedAt: null }, { upsert: true, new: true })

        const expiredTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        return {
            accessToken,
            refreshToken,
            expiredTime,
            role: user.role,
            name: user.name,
            email: user.email
        }
    }

    static async refreshToken(refreshTokenString: string) {
        // 1. Verify refresh token
        const decoded: any = verifyRefreshToken(refreshTokenString)

        if (!decoded || !decoded.userId) {
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        // 2. Kiểm tra refresh token trong DB
        const tokenDoc = await Auth.findOne({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!tokenDoc) {
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        // 3. Nếu refresh token đã bị đánh dấu revoke/ban thì chặn
        if (tokenDoc.revokedAt) {
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        // 4. Kiểm tra user
        const user = await User.findById(decoded.userId)
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }
        if (user.isActive === false) {
            throw new ForbiddenError(AUTH.ACCOUNT_DISABLED)
        }

        // 5. Sinh access token mới
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            role: user.role
        }

        const newAccessToken = generateAccessToken(tokenPayload)

        // 6. Trả lại access token mới
        return {
            accessToken: newAccessToken
        }
    }

    static async logout(refreshTokenString: string) {
        // 1. Verify refresh token
        const decoded: any = verifyRefreshToken(refreshTokenString)

        if (!decoded || !decoded.userId) {
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        // 2. Tìm token trong DB
        const tokenDoc = await Auth.findOne({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!tokenDoc) {
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        // 3. Gắn cờ revokedAt
        if (tokenDoc.revokedAt) {
            // Tránh revoke nhiều lần -> có thể log warning
            throw new AuthFailureError(AUTH.INVALID_REFRESH_TOKEN)
        }

        tokenDoc.revokedAt = new Date()
        await tokenDoc.save()

        // 4. Trả kết quả
        return {
            message: 'Đăng xuất thành công'
        }
    }

    static async registerUser(accessToken: string, userData: any) {
        // Kiểm tra accessToken OTP hợp lệ (hỗ trợ cả email và phone)
        const isValidEmailOTP = await OTPService.checkValidEmailOTPAfterRegister(accessToken)
        const isValidPhoneOTP = await OTPService.checkValidPhoneOTPAfterRegister(accessToken)

        if (!isValidEmailOTP && !isValidPhoneOTP) {
            throw new OtpError(AUTH.OTP_EXPIRED)
        }

        const user = await UserService.createUser(userData)
        return user
    }

    // ========== Google Auth Methods ==========

    /**
     * Kiểm tra tài khoản Google đã tồn tại chưa
     */
    static async checkGoogleAccount(googleId: string, email: string) {
        // Tìm user bằng googleId hoặc email
        const user = await User.findOne({
            $or: [{ googleId }, { email }]
        })

        if (user) {
            return {
                exists: true,
                needsRegistration: false,
                hasGoogleId: !!user.googleId
            }
        }

        return {
            exists: false,
            needsRegistration: true,
            hasGoogleId: false
        }
    }

    /**
     * Đăng ký tài khoản mới với Google
     */
    static async registerWithGoogle(googleUserData: { googleId: string; email: string; name: string; phone: string }) {
        const { googleId, email, name, phone } = googleUserData

        // Kiểm tra googleId đã tồn tại chưa
        const existingGoogleUser = await User.findOne({ googleId })
        if (existingGoogleUser) {
            throw new ConflictRequestError('Google ID đã được đăng ký')
        }

        // Kiểm tra email đã tồn tại chưa
        const existingEmailUser = await User.findOne({ email })
        if (existingEmailUser) {
            throw new ConflictRequestError('Email đã được đăng ký')
        }

        // Kiểm tra phone đã tồn tại chưa
        const existingPhoneUser = await User.findOne({ phone })
        if (existingPhoneUser) {
            throw new ConflictRequestError('Số điện thoại đã được đăng ký')
        }

        // Tạo user mới với Google
        const newUser = await User.create({
            googleId,
            email,
            name,
            phone,
            role: 'customer'
            // Không cần password cho Google users
        })

        // Tạo tokens
        const tokenPayload = {
            userId: newUser._id,
            email: newUser.email,
            role: newUser.role
        }

        const accessToken = generateAccessToken(tokenPayload)
        const refreshToken = generateRefreshToken({ userId: newUser._id })

        await Auth.findOneAndUpdate(
            { user: newUser._id },
            { refreshToken, revokedAt: null },
            { upsert: true, new: true }
        )

        const expiredTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        return {
            accessToken,
            refreshToken,
            expiredTime,
            role: newUser.role,
            name: newUser.name,
            email: newUser.email
        }
    }

    /**
     * Đăng nhập với Google (user đã có tài khoản)
     */
    static async loginWithGoogle(googleId: string, email: string) {
        // Tìm user bằng googleId hoặc email
        const user = await User.findOne({
            $or: [{ googleId }, { email }]
        })

        if (!user) {
            throw new NotFoundError(AUTH.GOOGLE_ACCOUNT_NOT_FOUND)
        }

        if (user.isActive === false) {
            throw new ForbiddenError(AUTH.ACCOUNT_DISABLED)
        }

        // Nếu user có email nhưng chưa có googleId, cập nhật googleId
        if (!user.googleId && googleId) {
            user.googleId = googleId
            await user.save()
        }

        const tokenPayload = {
            userId: user._id,
            email: user.email,
            role: user.role
        }

        const accessToken = generateAccessToken(tokenPayload)
        const refreshToken = generateRefreshToken({ userId: user._id })

        await Auth.findOneAndUpdate({ user: user._id }, { refreshToken, revokedAt: null }, { upsert: true, new: true })

        const expiredTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        return {
            accessToken,
            refreshToken,
            expiredTime,
            role: user.role,
            name: user.name,
            email: user.email
        }
    }
}

export default AuthService
