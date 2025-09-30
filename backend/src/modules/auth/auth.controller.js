import * as authService from './auth.service.js'

import { handleSuccess } from '../../utils/handleResponse.js'

export const login = async (req, res) => {
    const { email, password } = req.body

    const data = await authService.login(email, password)

    return handleSuccess(res, data, 'Đăng nhập thành công')
}

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body

    const data = await authService.refreshToken(refreshToken)

    return handleSuccess(res, data, 'Làm mới token thành công')
}

export const logout = async (req, res) => {
    const { refreshToken } = req.body

    const result = await authService.logout(refreshToken)

    return handleSuccess(res, null, result.message)
}

export const getCurrentUser = async (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    const userDoc = await authService.getCurrentUser(token)
    const user = userDoc.toObject ? userDoc.toObject() : userDoc

    return handleSuccess(res, user, 'Lấy thông tin người dùng thành công')
}
