import UserService from './user.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response } from 'express'

class UserController {
    static async createUser(req: Request, res: Response) {
        const data = await UserService.createUser(req.body)
        return handleSuccess(res, data, 'Tạo người dùng thành công', StatusCodes.CREATED)
    }

    static async getUserById(req: Request, res: Response) {
        const targetId = req.params._id

        const data = await UserService.getUserById(targetId)
        return handleSuccess(res, data)
    }

    static async updateUserById(req: Request, res: Response) {
        const targetId = req.params._id

        const data = await UserService.updateUser(targetId, req.body)
        return handleSuccess(res, data, 'Cập nhật người dùng thành công')
    }

    static async deleteUserById(req: Request, res: Response) {
        const data = await UserService.deleteUser(req.params._id)
        return handleSuccess(res, data, 'Xóa người dùng thành công')
    }

    static async setActiveById(req: Request, res: Response) {
        const { isActive } = req.body
        const data = await UserService.setUserActive(req.params._id, isActive)
        const message = isActive ? 'Đã bật tài khoản' : 'Đã tắt tài khoản'
        return handleSuccess(res, data, message)
    }
}

export default UserController
