import rateLimit from 'express-rate-limit'

export const limiter = (windowMs: number, max: number) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 429,
            error: 'Too many requests. Please slow down.'
        }
    })
