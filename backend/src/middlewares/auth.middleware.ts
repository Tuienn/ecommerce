import { Request, Response, NextFunction } from 'express'
import { AuthFailureError } from '../exceptions/error.handler'
import AuthService from '../modules/auth/auth.service'

const authenticateToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        throw new AuthFailureError('Access token không được cung cấp')
    }

    try {
        const user = await AuthService.getCurrentUser(token)
        req.user = user as any
        next()
    } catch (error) {
        const err = error as Error
        throw new AuthFailureError(err.message || 'Token không hợp lệ')
    }
}

export default authenticateToken
