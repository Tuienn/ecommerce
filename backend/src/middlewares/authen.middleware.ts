import { Request, Response, NextFunction } from 'express'
import { AuthFailureError, ForbiddenError, NotFoundError } from '../exceptions/error.handler'
import { verifyAccessToken } from '../utils/handleJwt'
import { AUTH } from '../constants/text'
import { User } from '../modules/index.model'

const authenticateToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return next(new AuthFailureError(AUTH.ACCESS_TOKEN_REQUIRED))
    }

    const decoded = verifyAccessToken(token)

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
        return next(new AuthFailureError(AUTH.INVALID_ACCESS_TOKEN))
    }

    const user = await User.findById(decoded.userId).lean()

    if (!user) {
        return next(new NotFoundError(AUTH.USER_NOT_FOUND + ' từ access token'))
    }

    if (user.isActive === false) {
        return next(new ForbiddenError(AUTH.ACCOUNT_DISABLED))
    }

    req.user = user

    next()
}

export default authenticateToken
