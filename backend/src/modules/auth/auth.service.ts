import { User, Auth } from '../index.model'
import { NotFoundError, AuthFailureError } from '../../exceptions/error.handler'
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../utils/handleJwt'
import { handleError } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'

class AuthService {
    static async login(email: string, password: string) {
        try {
            const user = await User.findOne({ email }).select('+password')
            if (!user) {
                throw new AuthFailureError('Email hoặc mật khẩu không đúng')
            }

            if (user.isActive === false) {
                throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
            }

            const isValidPassword = await user.comparePassword(password)
            if (!isValidPassword) {
                throw new AuthFailureError('Email hoặc mật khẩu không đúng')
            }

            const tokenPayload = {
                userId: user._id,
                email: user.email,
                role: user.role
            }

            const accessToken = generateAccessToken(tokenPayload)
            const refreshToken = generateRefreshToken({ userId: user._id })

            await Auth.findOneAndUpdate({ user: user._id }, { refreshToken }, { upsert: true, new: true })

            const expiredTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()

            return {
                accessToken,
                refreshToken,
                expiredTime,
                role: user.role,
                name: user.name,
                email: user.email
            }
        } catch (error) {
            handleError(error, 'Đăng nhập thất bại')
        }
    }

    static async refreshToken(refreshTokenString: string) {
        try {
            // 1. Verify refresh token
            const decoded: any = verifyRefreshToken(refreshTokenString)

            // 2. Kiểm tra refresh token trong DB
            const tokenDoc = await Auth.findOne({
                user: decoded.userId,
                refreshToken: refreshTokenString
            })

            if (!tokenDoc) {
                throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
            }

            // 3. Nếu refresh token đã bị đánh dấu revoke/ban thì chặn
            if (tokenDoc.revokedAt) {
                throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
            }

            // 4. Kiểm tra user
            const user = await User.findById(decoded.userId)
            if (!user) {
                throw new NotFoundError('Không tìm thấy người dùng')
            }
            if (user.isActive === false) {
                throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
            }

            // 5. Sinh access token mới
            const tokenPayload = {
                userId: user._id,
                email: user.email,
                role: user.role
            }

            const newAccessToken = generateAccessToken(tokenPayload)

            // 6. Không tạo refresh token mới, chỉ trả lại access token
            return {
                accessToken: newAccessToken
            }
        } catch (error) {
            handleError(error, 'Làm mới token thất bại')
            return null
        }
    }

    static async logout(refreshTokenString) {
        try {
            // 1. Verify refresh token
            const decoded = verifyRefreshToken(refreshTokenString)

            // 2. Tìm token trong DB
            const tokenDoc = await Auth.findOne({
                user: decoded.userId,
                refreshToken: refreshTokenString
            })

            if (!tokenDoc) {
                throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
            }

            // 3. Gắn cờ revokedAt
            if (tokenDoc.revokedAt) {
                // Tránh revoke nhiều lần -> có thể log warning
                throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
            }

            tokenDoc.revokedAt = new Date()
            await tokenDoc.save()

            // 4. Trả kết quả
            return {
                message: 'Đăng xuất thành công'
            }
        } catch (error) {
            handleError(error, 'Đăng xuất thất bại')
        }
    }

    static async getCurrentUser(accessToken: string) {
        const decoded: any = verifyAccessToken(accessToken)

        if (!decoded || !decoded.userId) {
            throw new AuthFailureError('Access token không hợp lệ hoặc đã hết hạn')
        }

        const user = await User.findById(decoded.userId)
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }
        if (user.isActive === false) {
            throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
        }

        return user
    }

    static async registerUserByEmail(accessToken: string, userData: any) {
        const { OTPService, UserService } = await import('../index.service')

        // Kiểm tra accessToken OTP hợp lệ
        const isValidOTP = await OTPService.checkValidEmailOTPAfterRegister(accessToken)
        if (!isValidOTP) {
            throw new AuthFailureError('Token OTP không hợp lệ hoặc đã hết hạn')
        }

        const user = await UserService.createUser(userData)
        return user
    }
}

export default AuthService
