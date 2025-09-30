const { AuthFailureError } = require('../exceptions/error.models')
const { authService } = require('../modules/index.service')

const authenticateToken = async (req, _res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        throw new AuthFailureError('Access token không được cung cấp')
    }

    try {
        const user = await authService.getCurrentUser(token)
        req.user = user
        next()
    } catch (error) {
        throw new AuthFailureError(error.message || 'Token không hợp lệ')
    }
}

module.exports = authenticateToken
