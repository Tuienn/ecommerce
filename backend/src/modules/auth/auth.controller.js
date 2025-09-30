const { authService } = require('../index.service')
const { StatusCodes } = require('../../constants/httpStatusCode')

const login = async (req, res) => {
    const { email, password } = req.body

    const data = await authService.login(email, password)

    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: 'Đăng nhập thành công',
        data
    })
}

const refreshToken = async (req, res) => {
    const { refresh_token } = req.body

    const data = await authService.refreshToken(refresh_token)

    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: 'Làm mới token thành công',
        data
    })
}

const logout = async (req, res) => {
    const { refresh_token } = req.body

    const result = await authService.logout(refresh_token)

    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: result.message,
        data: null
    })
}

const getCurrentUser = async (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    const userDoc = await authService.getCurrentUser(token)
    const user = userDoc.toObject ? userDoc.toObject() : userDoc

    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: 'Lấy thông tin người dùng thành công',
        data: user
    })
}

module.exports = {
    login,
    refreshToken,
    logout,
    getCurrentUser
}
