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
    // Sanitize body (mutable)
    if (req.body) {
        req.body = deepSanitize(req.body)
    }

    // Sanitize query (read-only in Express 5, need to modify in place)
    if (req.query && typeof req.query === 'object') {
        const sanitized = deepSanitize({ ...req.query })
        Object.keys(req.query).forEach((key) => delete (req.query as any)[key])
        Object.assign(req.query, sanitized)
    }

    // Sanitize params (read-only in Express 5, need to modify in place)
    if (req.params && typeof req.params === 'object') {
        const sanitized = deepSanitize({ ...req.params })
        Object.keys(req.params).forEach((key) => delete (req.params as any)[key])
        Object.assign(req.params, sanitized)
    }

    next()
}
