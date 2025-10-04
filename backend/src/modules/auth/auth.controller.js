import AuthService from './auth.service.js'
import { handleSuccess } from '../../utils/handleRes.js'
import { BadRequestError } from '../../exceptions/error.handler.js'
import { isValidEmail, isValidPassword } from '../../utils/validate.js'

class AuthController {
    static async login(req, res) {
        const { email, password } = req.body

        if (!email || !password) {
            throw new BadRequestError('Thiếu thông tin đăng nhập')
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('Email không hợp lệ')
        }

        if (!isValidPassword(password)) {
            throw new BadRequestError('Mật khẩu không hợp lệ')
        }

        const data = await AuthService.login(email, password)

        return handleSuccess(res, data, 'Đăng nhập thành công')
    }

    static async refreshToken(req, res) {
        const { refreshToken } = req.body

        if (!refreshToken) {
            throw new BadRequestError('Thiếu thông tin refreshtoken')
        }

        const data = await AuthService.refreshToken(refreshToken)

        return handleSuccess(res, data, 'Làm mới token thành công')
    }

    static async logout(req, res) {
        const { refreshToken } = req.body

        if (!refreshToken) {
            throw new BadRequestError('Thiếu thông tin refreshtoken')
        }

        const result = await AuthService.logout(refreshToken)

        return handleSuccess(res, null, result.message)
    }

    static async getCurrentUser(req, res) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        const userDoc = await AuthService.getCurrentUser(token)
        const user = userDoc.toObject ? userDoc.toObject() : userDoc

        return handleSuccess(res, user, 'Lấy thông tin người dùng thành công')
    }

    static async registerUserByEmail(req, res) {
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
}

export default AuthController
