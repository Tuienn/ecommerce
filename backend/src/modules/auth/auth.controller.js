const { authService } = require('../index.service')
const { StatusCodes } = require('../../constants/httpStatusCode')
const { handleSuccess } = require('../../utils/handleResponse')

const login = async (req, res) => {
    const { email, password } = req.body

    const data = await authService.login(email, password)

    return handleSuccess(res, data, 'Đăng nhập thành công', StatusCodes.OK)
}

const refreshToken = async (req, res) => {
    const { refresh_token } = req.body

    const data = await authService.refreshToken(refresh_token)

    return handleSuccess(res, data, 'Làm mới token thành công', StatusCodes.OK)
}

const logout = async (req, res) => {
    const { refresh_token } = req.body

    const result = await authService.logout(refresh_token)

    return handleSuccess(res, null, result.message, StatusCodes.OK)
}

const getCurrentUser = async (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    const userDoc = await authService.getCurrentUser(token)
    const user = userDoc.toObject ? userDoc.toObject() : userDoc

    return handleSuccess(res, user, 'Lấy thông tin người dùng thành công', StatusCodes.OK)
}

module.exports = {
    login,
    refreshToken,
    logout,
    getCurrentUser
}
