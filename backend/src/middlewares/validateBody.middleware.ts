import { Request, Response, NextFunction } from 'express'

const validateBody = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase()
    if (!['POST', 'PUT', 'PATCH'].includes(method)) return next()

    const contentType = req.headers['content-type'] || ''
    if (contentType.includes('multipart/form-data')) {
        return next()
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            code: 400,
            message: 'Thiếu body data',
            data: null
        })
    }

    next()
}

export default validateBody
