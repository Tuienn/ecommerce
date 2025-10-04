import { Request, Response, NextFunction } from 'express'

export function sanitize(obj: any) {
    for (const key in obj) {
        if (/[$.]/.test(key)) {
            delete obj[key]
        } else if (typeof obj[key] === 'object') {
            sanitize(obj[key])
        }
    }
}

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
        sanitize(req.body)
    }
    if (req.query) {
        sanitize(req.query)
    }
    if (req.params) {
        sanitize(req.params)
    }
    next()
}
