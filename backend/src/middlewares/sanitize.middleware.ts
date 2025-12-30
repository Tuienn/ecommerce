import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

function deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
        return xss(obj) // chống XSS
    }

    if (Array.isArray(obj)) {
        return obj.map(deepSanitize)
    }

    if (obj !== null && typeof obj === 'object') {
        for (const key in obj) {
            // chống NoSQL Injection
            if (key.includes('$') || key.includes('.')) {
                delete obj[key]
                continue
            }

            obj[key] = deepSanitize(obj[key])
        }
    }

    return obj
}

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) req.body = deepSanitize(req.body)
    if (req.query) req.query = deepSanitize(req.query)
    if (req.params) req.params = deepSanitize(req.params)
    next()
}
