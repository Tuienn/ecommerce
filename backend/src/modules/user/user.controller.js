import { UserService } from '../index.service.js'
import { StatusCodes } from '../../constants/httpStatusCode.js'
import { AuthFailureError } from '../../exceptions/error.handler.js'
import { handleSuccess } from '../../utils/handleRes.js'

const { DEFAULT_EMAIL_ADMIN } = process.env

export const createUser = async (req, res) => {
    const data = await UserService.createUser(req.body)
    return handleSuccess(res, data, 'Tạo người dùng thành công', StatusCodes.CREATED)
}

export const getUserById = async (req, res) => {
    const targetId = req.params._id
    const current = req.user

    // Only main admin can view anyone; others can only view themselves
    const isMainAdmin = current.role === 'admin' && current.email === DEFAULT_EMAIL_ADMIN
    if (!isMainAdmin && String(current._id) !== String(targetId)) {
        throw new AuthFailureError('Không có quyền xem thông tin người dùng này')
    }

    const data = await UserService.getUserById(targetId)
    return handleSuccess(res, data)
}

export const listUsers = async (req, res) => {
    const data = await UserService.listUsers(req.query)
    return handleSuccess(res, data)
}

export const updateUserById = async (req, res) => {
    const targetId = req.params._id
    const current = req.user
    const isMainAdmin = current.role === 'admin' && current.email === DEFAULT_EMAIL_ADMIN

    if (!isMainAdmin) {
        if (String(current._id) !== String(targetId)) {
            throw new AuthFailureError('Không có quyền cập nhật người dùng này')
        }
        // Only allow self to change email/password
        const allowed = {}
        if (typeof req.body.email === 'string') allowed.email = req.body.email
        if (typeof req.body.password === 'string') allowed.password = req.body.password
        if (typeof req.body.name === 'string') allowed.name = req.body.name
        // ignore other fields
        const data = await UserService.updateUser(targetId, allowed)
        return handleSuccess(res, data, 'Cập nhật người dùng thành công')
    }

    const data = await UserService.updateUser(targetId, req.body)
    return handleSuccess(res, data, 'Cập nhật người dùng thành công')
}

export const deleteUserById = async (req, res) => {
    const data = await UserService.deleteUser(req.params._id)
    return handleSuccess(res, data, 'Xóa người dùng thành công')
}

export const setActiveById = async (req, res) => {
    const { isActive } = req.body
    const data = await UserService.setUserActive(req.params._id, isActive)
    const message = isActive ? 'Đã bật tài khoản' : 'Đã tắt tài khoản'
    return handleSuccess(res, data, message)
}
