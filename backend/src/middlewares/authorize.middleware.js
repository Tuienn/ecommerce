// middlewares/authorize.js
import { AuthFailureError } from '../exceptions/error.handler.js'

/**
 * @param {string|string[]} roles - role được phép truy cập (vd: 'admin' hoặc ['admin','user'])
 */
function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles]
    }

    return (req, _res, next) => {
        if (!req.user) {
            throw new AuthFailureError('Người dùng chưa được xác thực')
        }

        // kiểm tra role
        if (roles.length && !roles.includes(req.user.role)) {
            throw new AuthFailureError('Bạn không có quyền truy cập tài nguyên này')
        }

        next()
    }
}

export default authorize
