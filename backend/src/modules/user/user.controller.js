const { userService } = require('../index.service')
const { ReasonPhrases, StatusCodes } = require('../../constants/httpStatusCode')
const { AuthFailureError } = require('../../exceptions/error.models')
const { handleSuccess } = require('../../utils/handleResponse')

const { DEFAULT_EMAIL_ADMIN } = process.env

const createUser = async (req, res) => {
    const data = await userService.createUser(req.body)
    return handleSuccess(res, data, 'Tạo người dùng thành công', StatusCodes.CREATED)
}

const getUserById = async (req, res) => {
    const targetId = req.params._id
    const current = req.user

    // Only main admin can view anyone; others can only view themselves
    const isMainAdmin = current.role === 'admin' && current.email === DEFAULT_EMAIL_ADMIN
    if (!isMainAdmin && String(current._id) !== String(targetId)) {
        throw new AuthFailureError('Không có quyền xem thông tin người dùng này')
    }

    const data = await userService.getUserById(targetId)
    return handleSuccess(res, data, ReasonPhrases.OK, StatusCodes.OK)
}

const listUsers = async (req, res) => {
    const data = await userService.listUsers(req.query)
    return handleSuccess(res, data, ReasonPhrases.OK, StatusCodes.OK)
}

const updateUser = async (req, res) => {
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
        const data = await userService.updateUser(targetId, allowed)
        return handleSuccess(res, data, 'Cập nhật người dùng thành công', StatusCodes.OK)
    }

    const data = await userService.updateUser(targetId, req.body)
    return handleSuccess(res, data, 'Cập nhật người dùng thành công', StatusCodes.OK)
}

const deleteUser = async (req, res) => {
    const data = await userService.deleteUser(req.params._id)
    return handleSuccess(res, data, 'Xóa người dùng thành công', StatusCodes.OK)
}

const setActive = async (req, res) => {
    const { isActive } = req.body
    const data = await userService.setUserActive(req.params._id, isActive)
    const message = isActive ? 'Đã bật tài khoản' : 'Đã tắt tài khoản'
    return handleSuccess(res, data, message, StatusCodes.OK)
}

module.exports = {
    createUser,
    getUserById,
    listUsers,
    updateUser,
    deleteUser,
    setActive
}
