const { User, Token } = require('../index.model')
const { NotFoundError, AuthFailureError } = require('../../exceptions/error.models')
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require('../../utils/handleJwtToken')

const login = async (email, password) => {
    try {
        const user = await User.findOne({ email })
        if (!user) {
            throw new AuthFailureError('Email hoặc mật khẩu không đúng')
        }

        // console.log(user);

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
            role: user.role,
            permissions: user.permissions || []
        }

        const accessToken = generateAccessToken(tokenPayload)
        const refreshToken = generateRefreshToken({ userId: user._id })

        await Token.findOneAndUpdate({ user: user._id }, { refreshToken }, { upsert: true, new: true })

        const expiredTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expired_time: expiredTime,
            role: user.role,
            name: user.name,
            email: user.email
        }
    } catch (error) {
        throw error
    }
}

const refreshToken = async (refreshTokenString) => {
    try {
        const decoded = verifyRefreshToken(refreshTokenString)

        const tokenDoc = await Token.findOne({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!tokenDoc) {
            throw new AuthFailureError('Refresh token không hợp lệ')
        }

        if (tokenDoc.refreshTokenUsed.includes(refreshTokenString)) {
            throw new AuthFailureError('Refresh token đã được sử dụng')
        }

        const user = await User.findById(decoded.userId)
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }
        if (user.isActive === false) {
            throw new AuthFailureError('Tài khoản đã bị vô hiệu hoá')
        }

        const tokenPayload = {
            userId: user._id,
            email: user.email,
            role: user.role
        }

        const newAccessToken = generateAccessToken(tokenPayload)
        const newRefreshToken = generateRefreshToken({ userId: user._id })

        tokenDoc.refreshTokenUsed.push(refreshTokenString)
        await tokenDoc.save()
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
        }
        throw error
    }
}

const logout = async (refreshTokenString) => {
    try {
        const decoded = verifyRefreshToken(refreshTokenString)

        const result = await Token.findOneAndDelete({
            user: decoded.userId,
            refreshToken: refreshTokenString
        })

        if (!result) {
            throw new AuthFailureError('Refresh token không hợp lệ')
        }

        return {
            message: 'Đăng xuất thành công'
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn')
        }
        throw error
    }
}

const getCurrentUser = async (accessToken) => {
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
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthFailureError('Access token không hợp lệ hoặc đã hết hạn')
        }
        throw error
    }
}

module.exports = {
    login,
    refreshToken,
    logout,
    getCurrentUser,
    verifyAccessToken
}
