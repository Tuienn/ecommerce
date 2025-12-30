import { AuthFailureError } from '../exceptions/error.handler'
import { Request, Response, NextFunction } from 'express'
import { UserRole } from '../types/user'

/**
 * Middleware kiểm tra quyền truy cập routes dành cho admin
 */
export function requireAdmin() {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AuthFailureError('Người dùng chưa được xác thực')
        }

        if (req.user.role !== 'admin') {
            throw new AuthFailureError('Chỉ admin mới có quyền truy cập')
        }

        next()
    }
}

/**
 * Kiểm tra xem có ít nhất một participant là admin không
 * @param participantRoles - Danh sách role của các participants
 */
export function hasAdminParticipant(participantRoles: UserRole[]): boolean {
    return participantRoles.includes('admin')
}
