import { User, Auth } from '../index.model.js'
import {
    NotFoundError,
    AuthFailureError,
    BadRequestError,
    ConflictRequestError
} from '../../exceptions/error.handler.js'
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} from '../../utils/handleJwt.js'
import { OTPService, UserService } from '../index.service.js'

export const login = async (email, password) => {
    try {
        const user = await User.findOne({ email }).select('+password')
        if (!user) {
            console.log('User not found with email:', email)
            throw new AuthFailureError('Email hoặc mật khẩu không đúng')
        }

        if (user.isActive === false) {
            throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
        }

        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
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
        console.log('🚀 ~ login ~ expiredTime:', expiredTime)

        return {
            accessToken,
            refreshToken,
            expiredTime,
            role: user.role,
            name: user.name,
            email: user.email
        }
    } catch (error) {
        // Nếu là AuthFailureError thì throw nguyên bản
        if (error instanceof AuthFailureError) {
            throw error
        }
        console.error('Login error:', error)
        throw new BadRequestError('Đăng nhập thất bại')
    }
}

export const refreshToken = async (refreshTokenString) => {
    try {
        // 1. Verify refresh token
        const decoded = verifyRefreshToken(refreshTokenString)

        // 2. Kiểm tra refresh token trong DB
        const tokenDoc = await Auth.findOne({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!tokenDoc) {
            throw new AuthFailureError('Refresh token không hợp lệ')
        }

        // 3. Nếu refresh token đã bị đánh dấu revoke/ban thì chặn
        if (tokenDoc.revokedAt) {
            throw new AuthFailureError('Refresh token đã bị thu hồi')
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
        if (error instanceof AuthFailureError || error instanceof NotFoundError) {
            throw error
        }
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
        }
        throw new BadRequestError('Làm mới token thất bại')
    }
}

export const logout = async (refreshTokenString) => {
    try {
        // 1. Verify refresh token
        const decoded = verifyRefreshToken(refreshTokenString)

        // 2. Tìm token trong DB
        const tokenDoc = await Auth.findOne({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!tokenDoc) {
            throw new AuthFailureError('Refresh token không hợp lệ')
        }

        // 3. Gắn cờ revokedAt
        if (tokenDoc.revokedAt) {
            // Tránh revoke nhiều lần -> có thể log warning
            throw new AuthFailureError('Refresh token đã bị thu hồi trước đó')
        }

        tokenDoc.revokedAt = new Date()
        await tokenDoc.save()

        // 4. Trả kết quả
        return {
            message: 'Đăng xuất thành công'
        }
    } catch (error) {
        if (error instanceof AuthFailureError) {
            throw error
        }
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
        }
        throw new BadRequestError('Đăng xuất thất bại')
    }
}

export const getCurrentUser = async (accessToken) => {
    try {
        const decoded = verifyAccessToken(accessToken)

        const user = await User.findById(decoded.userId).select('-password')
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }
        if (user.isActive === false) {
            throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
        }

        return user
    } catch (error) {
        if (error instanceof AuthFailureError || error instanceof NotFoundError) {
            throw error
        }
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Access token không hợp lệ hoặc đã hết hạn')
        }
        throw new BadRequestError('Lấy thông tin người dùng thất bại')
    }
}

export const registerUserByEmail = async (accessToken, userData) => {
    try {
        // Kiểm tra accessToken OTP hợp lệ
        const isValidOTP = await OTPService.checkValidEmailOTPAfterRegister(accessToken)
        if (!isValidOTP) {
            throw new AuthFailureError('Token OTP không hợp lệ hoặc đã hết hạn')
        }

        const user = await UserService.createUser(userData)
        return user
    } catch (error) {
        console.error('Error in registerUserByEmail:', error)
        if (error instanceof AuthFailureError || error instanceof ConflictRequestError) {
            throw error
        }
        throw new BadRequestError('Đăng ký thất bại')
    }
}
