import { AuthFailureError } from '../exceptions/error.handler'
import { Request, Response, NextFunction } from 'express'
import { UserRole } from '../types/user'

function authorize(roles: UserRole | UserRole[] = []) {
    // Normalize roles to array
    const roleArray = typeof roles === 'string' ? [roles] : roles

    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AuthFailureError('Người dùng chưa được xác thực')
        }

        // kiểm tra role
        if (roleArray.length && !roleArray.includes(req.user.role)) {
            throw new AuthFailureError('Bạn không có quyền truy cập tài nguyên này')
        }

        next()
    }
}

export default authorize
