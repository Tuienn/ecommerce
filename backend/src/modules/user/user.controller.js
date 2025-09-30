const { userService } = require('../index.services')
const { ReasonPhrases, StatusCodes } = require('../../constants/httpStatusCode')
const { AuthFailureError } = require('../../exceptions/error.models')

const { DEFAULT_EMAIL_ADMIN } = process.env

const checkMainAdmin = (req) => {
    const { role, email } = req.user
    if (role !== 'admin' || email !== DEFAULT_EMAIL_ADMIN) {
        throw new AuthFailureError('Chỉ admin tổng mới thực hiện được chức năng này')
    }
}

const createUser = async (req, res) => {
    checkMainAdmin(req)
    const data = await userService.createUser(req.body)
    res.status(StatusCodes.CREATED).json({
        code: StatusCodes.CREATED,
        message: 'Tạo người dùng thành công',
        data
    })
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
    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data
    })
}

const listUsers = async (req, res) => {
    checkMainAdmin(req)
    const data = await userService.listUsers(req.query)
    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data
    })
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
        return res.status(StatusCodes.OK).json({
            code: StatusCodes.OK,
            message: 'Cập nhật người dùng thành công',
            data
        })
    }

    const data = await userService.updateUser(targetId, req.body)
    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: 'Cập nhật người dùng thành công',
        data
    })
}

const deleteUser = async (req, res) => {
    checkMainAdmin(req)

    const data = await userService.deleteUser(req.params._id)
    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: 'Xóa người dùng thành công',
        data
    })
}

const setActive = async (req, res) => {
    checkMainAdmin(req)
    const { isActive } = req.body
    const data = await userService.setUserActive(req.params._id, isActive)
    res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        message: isActive ? 'Đã bật tài khoản' : 'Đã tắt tài khoản',
        data
    })
}

module.exports = {
    createUser,
    getUserById,
    listUsers,
    updateUser,
    deleteUser,
    setActive
}
