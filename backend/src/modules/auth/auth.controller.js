import { AuthService } from '../index.service.js'
import { handleSuccess } from '../../utils/handleRes.js'
import { BadRequestError } from '../../exceptions/error.handler.js'

export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new BadRequestError('Thiếu thông tin đăng nhập')
    }

    const data = await AuthService.login(email, password)

    return handleSuccess(res, data, 'Đăng nhập thành công')
}

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        throw new BadRequestError('Thiếu thông tin refreshtoken')
    }

    const data = await AuthService.refreshToken(refreshToken)

    return handleSuccess(res, data, 'Làm mới token thành công')
}

export const logout = async (req, res) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        throw new BadRequestError('Thiếu thông tin refreshtoken')
    }

    const result = await AuthService.logout(refreshToken)

    return handleSuccess(res, null, result.message)
}

export const getCurrentUser = async (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    const userDoc = await AuthService.getCurrentUser(token)
    const user = userDoc.toObject ? userDoc.toObject() : userDoc

    return handleSuccess(res, user, 'Lấy thông tin người dùng thành công')
}

export const registerUserByEmail = async (req, res) => {
    const authHeader = req.headers['authorization']
    const accessToken = authHeader && authHeader.split(' ')[1]

    if (!accessToken) {
        throw new BadRequestError('Thiếu token xác thực OTP')
    }

    const { name, email, password, phone } = req.body

    if (!name || !email || !password || !phone) {
        throw new BadRequestError('Thiếu thông tin bắt buộc: tên, email, mật khẩu, số điện thoại')
    }

    const userData = await AuthService.registerUserByEmail(accessToken, req.body)

    return handleSuccess(res, userData, 'Đăng ký người dùng thành công')
}
