import UserService from './user.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { invalidDataField, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'
import { isValidEmail, isValidPassword, isValidPhoneNumber, isValidRoleUser } from '../../utils/validate'

class UserController {
    static async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name, phone, role = 'customer' } = req.body

            if (!email || !password || !name || !phone) {
                throw new BadRequestError(missingDataField('email, mật khẩu, tên hoặc số điện thoại'))
            }

            if (!isValidEmail(email)) throw new BadRequestError(invalidDataField('email'))
            if (!isValidPassword(password)) throw new BadRequestError(invalidDataField('mật khẩu'))
            if (!isValidPhoneNumber(phone)) throw new BadRequestError(invalidDataField('số điện thoại'))
            if (!isValidRoleUser(role)) throw new BadRequestError(invalidDataField('vai trò'))

            const data = await UserService.createUser({ role: 'customer', ...req.body })
            return handleSuccess(res, data, 'Tạo người dùng thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const targetId = req.params._id
            const data = await UserService.getUserById(targetId)
            return handleSuccess(res, data.toObject(), 'Lấy thông tin người dùng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async updateUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const targetId = req.params._id

            if (req.user?._id && req.user._id.toString() === targetId) {
                throw new BadRequestError('Không thể cập nhật chính mình')
            }

            const { email, password, name, phone, role = 'customer' } = req.body

            if (!email || !password || !name || !phone) {
                throw new BadRequestError(missingDataField('email, mật khẩu, tên hoặc số điện thoại'))
            }

            if (!isValidEmail(email)) throw new BadRequestError(invalidDataField('email'))
            if (!isValidPassword(password)) throw new BadRequestError(invalidDataField('mật khẩu'))
            if (!isValidPhoneNumber(phone)) throw new BadRequestError(invalidDataField('số điện thoại'))
            if (!isValidRoleUser(role)) throw new BadRequestError(invalidDataField('vai trò'))

            const data = await UserService.updateUser(targetId, { role: 'customer', ...req.body })
            return handleSuccess(res, data, 'Cập nhật người dùng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async deleteUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const targetId = req.params._id

            if (req.user?._id && req.user._id.toString() === targetId) {
                throw new BadRequestError('Không thể xóa chính mình')
            }

            await UserService.deleteUser(targetId)
            return handleSuccess(res, null, 'Xóa người dùng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async setActiveById(req: Request, res: Response, next: NextFunction) {
        try {
            const targetId = req.params._id

            if (req.user?._id && req.user._id.toString() === targetId) {
                throw new BadRequestError('Không thể cập nhật trạng thái chính mình')
            }

            const { isActive } = req.body
            const data = await UserService.setUserActive(targetId, isActive)
            const message = isActive ? 'Đã bật tài khoản' : 'Đã tắt tài khoản'
            return handleSuccess(res, data, message)
        } catch (error) {
            next(error)
            return
        }
    }
}

export default UserController
