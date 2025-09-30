const { AuthFailureError } = require('../exceptions/error.models')
const { authService } = require('../modules/index.service')

const authenticateToken = async (req, _res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        // return res.status(StatusCodes.UNAUTHORIZED).json({
        //     code: StatusCodes.UNAUTHORIZED,
        //     message: 'Access token không được cung cấp'
        // })
        throw new AuthFailureError('Access token không được cung cấp')
    }

    try {
        const user = await authService.getCurrentUser(token)
        req.user = user
        next()
    } catch (error) {
        // return res.status(StatusCodes.FORBIDDEN).json({
        //     code: StatusCodes.FORBIDDEN,
        //     message: error.message || 'Token không hợp lệ'
        // })
        throw new AuthFailureError(error.message || 'Token không hợp lệ')
    }
}

module.exports = authenticateToken
