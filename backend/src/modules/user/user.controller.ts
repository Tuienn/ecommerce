import { UserService } from '../index.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { AUTH, invalidDataField, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'
import { isValidEmail, isValidPassword, isValidPhoneNumber, isValidRoleUser } from '../../utils/validate'
import { Types } from 'mongoose'

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

    static async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
            const role = req.query.role as string | undefined

            const data = await UserService.getAllUsers({ page, limit, isActive, role })
            return handleSuccess(res, data, 'Lấy danh sách người dùng thành công')
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

    /**
     * POST /api/user/address - Thêm địa chỉ mới
     */
    static async addAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const { name, phone, addressLine, city, ward, isDefault } = req.body

            if (!name || !phone || !addressLine || !city || !ward) {
                throw new BadRequestError(missingDataField('name, phone, addressLine, city hoặc ward'))
            }

            if (!isValidPhoneNumber(phone)) {
                throw new BadRequestError(invalidDataField('số điện thoại'))
            }

            // Validate isDefault nếu có
            if (isDefault !== undefined && typeof isDefault !== 'boolean') {
                throw new BadRequestError(invalidDataField('isDefault (phải là boolean)'))
            }

            const data = await UserService.addAddress(userId, req.body)
            return handleSuccess(res, data, 'Thêm địa chỉ thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * PATCH /api/user/address/:_id/default - Cập nhật địa chỉ mặc định
     */
    static async updateDefaultAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const addressId = req.params._id

            if (!Types.ObjectId.isValid(addressId)) {
                throw new BadRequestError(invalidDataField('id địa chỉ'))
            }

            const data = await UserService.updateDefaultAddress(userId, addressId)
            return handleSuccess(res, data, 'Cập nhật địa chỉ mặc định thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * PUT /api/user/address/:_id - Cập nhật thông tin địa chỉ
     */
    static async updateAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const addressId = req.params._id

            if (!Types.ObjectId.isValid(addressId)) {
                throw new BadRequestError(invalidDataField('id địa chỉ'))
            }

            const { phone, isDefault } = req.body

            // Validate phone nếu có
            if (phone && !isValidPhoneNumber(phone)) {
                throw new BadRequestError(invalidDataField('số điện thoại'))
            }

            // Validate isDefault nếu có
            if (isDefault !== undefined && typeof isDefault !== 'boolean') {
                throw new BadRequestError(invalidDataField('isDefault (phải là boolean)'))
            }

            const data = await UserService.updateAddress(userId, addressId, req.body)
            return handleSuccess(res, data, 'Cập nhật địa chỉ thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * GET /api/user/address - Lấy danh sách địa chỉ
     */
    static async getAddresses(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const data = await UserService.getAddresses(userId)
            return handleSuccess(res, data, 'Lấy danh sách địa chỉ thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * DELETE /api/user/address/:_id - Xóa địa chỉ
     */
    static async deleteAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const addressId = req.params._id

            await UserService.deleteAddress(userId, addressId)
            return handleSuccess(res, null, 'Xóa địa chỉ thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default UserController
