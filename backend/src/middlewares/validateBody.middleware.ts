import { Request, Response, NextFunction } from 'express'

const validateBody = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase()

    // Chỉ áp dụng cho POST, PUT, PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
        return next()
    }

    // Nếu là multipart/form-data (upload file)
    const contentType = req.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    // Nếu là form-data và có file hoặc fields => OK
    if (isMultipart) {
        const hasFile = req.files && Object.keys(req.files).length > 0
        const hasBody = req.body && Object.keys(req.body).length > 0

        if (!hasFile && !hasBody) {
            return res.status(400).json({
                code: 400,
                message: 'Thiếu body data',
                data: null
            })
        }

        return next()
    }

    // Nếu là JSON body (application/json)
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
