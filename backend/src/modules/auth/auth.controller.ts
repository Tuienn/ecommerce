import AuthService from './auth.service'
import { handleSuccess } from '../../utils/handleRes'
import { BadRequestError } from '../../exceptions/error.handler'
import { isValidEmail, isValidPassword, isValidPhoneNumber } from '../../utils/validate'
import { Request, Response, NextFunction } from 'express'
import { invalidDataField, missingDataField } from '../../constants/text'

class AuthController {
    static async loginByEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                throw new BadRequestError(missingDataField('email hoặc mật khẩu'))
            }

            if (!isValidEmail(email)) throw new BadRequestError(invalidDataField('email'))
            if (!isValidPassword(password)) throw new BadRequestError(invalidDataField('mật khẩu'))

            const data = await AuthService.loginByEmail(email, password)
            return handleSuccess(res, data, 'Đăng nhập thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                throw new BadRequestError(missingDataField('refreshToken'))
            }

            const data = await AuthService.refreshToken(refreshToken)
            return handleSuccess(res, data, 'Làm mới token thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                throw new BadRequestError(missingDataField('refreshToken'))
            }

            const result = await AuthService.logout(refreshToken)
            if (!result) {
                return handleSuccess(res, null, 'Đăng xuất không thành công hoặc token không hợp lệ')
            }

            return handleSuccess(res, null, result.message)
        } catch (error) {
            next(error)
            return
        }
    }

    static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
        try {
            return handleSuccess(res, req.user, 'Lấy thông tin người dùng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async registerUser(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers['authorization']
            const accessToken = authHeader && authHeader.split(' ')[1]

            if (!accessToken) {
                throw new BadRequestError(missingDataField('token xác thực OTP'))
            }

            const { name, email, password, phone } = req.body

            if (!name || !email || !password || !phone) {
                throw new BadRequestError(missingDataField('tên, email, mật khẩu hoặc số điện thoại'))
            }

            if (!isValidEmail(email)) throw new BadRequestError(invalidDataField('email'))
            if (!isValidPassword(password)) throw new BadRequestError(invalidDataField('mật khẩu'))
            if (!isValidPhoneNumber(phone)) throw new BadRequestError(invalidDataField('số điện thoại'))

            const userData = await AuthService.registerUser(accessToken, req.body)
            return handleSuccess(res, userData, 'Đăng ký người dùng thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default AuthController
