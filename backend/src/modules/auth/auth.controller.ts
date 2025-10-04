import AuthService from './auth.service'
import { handleSuccess } from '../../utils/handleRes'
import { BadRequestError } from '../../exceptions/error.handler'
import { isValidEmail, isValidPassword } from '../../utils/validate'
import { Request, Response } from 'express'

class AuthController {
    static async login(req: Request, res: Response) {
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

    static async refreshToken(req: Request, res: Response) {
        const { refreshToken } = req.body

        if (!refreshToken) {
            throw new BadRequestError('Thiếu thông tin refreshtoken')
        }

        const data = await AuthService.refreshToken(refreshToken)

        return handleSuccess(res, data, 'Làm mới token thành công')
    }

    static async logout(req: Request, res: Response) {
        const { refreshToken } = req.body

        if (!refreshToken) {
            throw new BadRequestError('Thiếu thông tin refreshtoken')
        }

        const result = await AuthService.logout(refreshToken)

        if (!result) {
            return
        }

        return handleSuccess(res, null, result.message)
    }

    static async getCurrentUser(req: Request, res: Response) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            throw new BadRequestError('Thiếu access token')
        }

        const userDoc = await AuthService.getCurrentUser(token)
        const user = userDoc.toObject ? userDoc.toObject() : userDoc

        return handleSuccess(res, user, 'Lấy thông tin người dùng thành công')
    }

    static async registerUserByEmail(req: Request, res: Response) {
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
