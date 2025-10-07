import { Request, Response, NextFunction } from 'express'

const formatRequestBody = (req: Request) => {
    // Nếu không có body
    if (!req.body || Object.keys(req.body).length === 0) {
        return null
    }

    // Clone body để tránh modify original
    const body = { ...req.body }

    // Ẩn sensitive fields
    const sensitiveFields = ['password', 'refreshToken', 'accessToken', 'token']
    sensitiveFields.forEach((field) => {
        if (body[field]) {
            body[field] = '***HIDDEN***'
        }
    })

    return body
}

type MulterFilesInput =
    | Express.Multer.File
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined

const formatFiles = (files: MulterFilesInput) => {
    if (!files) return null

    // Multiple files (array) - e.g., multer.array() / multer.any()
    if (Array.isArray(files)) {
        return files.map((file) => ({
            fieldname: file.fieldname,
            // filename may not exist in some storage engines, fallback to originalname
            filename: file.originalname || (file as any).filename,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            mimetype: file.mimetype
        }))
    }

    // Single file (multer.single())
    if (typeof (files as any).fieldname === 'string' && typeof (files as any).mimetype === 'string') {
        const file = files as Express.Multer.File
        return {
            fieldname: file.fieldname,
            filename: file.originalname || (file as any).filename,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            mimetype: file.mimetype
        }
    }

    // Object mapping (multer.fields())
    const record = files as Record<string, Express.Multer.File[]>
    const result: Array<{ fieldname: string; filename: string; size: string; mimetype: string }> = []
    for (const key of Object.keys(record)) {
        const list = record[key] || []
        for (const file of list) {
            result.push({
                fieldname: file.fieldname,
                filename: file.originalname || (file as any).filename,
                size: `${(file.size / 1024).toFixed(2)} KB`,
                mimetype: file.mimetype
            })
        }
    }
    return result
}

const formatResponse = (data: any) => {
    if (!data) return null

    let responseData = data

    // Nếu response có cấu trúc {code, message, data}, format đặc biệt
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        if (parsed && typeof parsed === 'object' && 'code' in parsed && 'message' in parsed) {
            responseData = {
                code: parsed.code,
                message: parsed.message,
                data: parsed.data
                    ? JSON.stringify(parsed.data).length > 500
                        ? {
                              preview: JSON.stringify(parsed.data).substring(0, 300) + '...',
                              size: `${(JSON.stringify(parsed.data).length / 1024).toFixed(2)} KB`,
                              truncated: true
                          }
                        : parsed.data
                    : parsed.data
            }
            return responseData
        }
    } catch (e) {
        // Nếu không parse được, tiếp tục với logic cũ
    }

    // Logic cũ cho các response khác
    const dataStr = JSON.stringify(responseData)
    if (dataStr.length > 1000) {
        return {
            preview: dataStr.substring(0, 500) + '...',
            size: `${(dataStr.length / 1024).toFixed(2)} KB`,
            truncated: true
        }
    }

    return responseData
}

const getColorByStatus = (status: number) => {
    if (status >= 200 && status < 300) return '\x1b[32m' // Green
    if (status >= 300 && status < 400) return '\x1b[36m' // Cyan
    if (status >= 400 && status < 500) return '\x1b[33m' // Yellow
    if (status >= 500) return '\x1b[31m' // Red
    return '\x1b[0m' // Reset
}

const getColorByMethod = (method: string) => {
    const colors = {
        GET: '\x1b[32m', // Green
        POST: '\x1b[36m', // Cyan
        PUT: '\x1b[33m', // Yellow
        PATCH: '\x1b[35m', // Magenta
        DELETE: '\x1b[31m' // Red
    }
    return colors[method as keyof typeof colors] || '\x1b[0m'
}

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()

    // Capture response data
    const originalSend = res.send
    let responseBody: any = null

    res.send = function (data) {
        responseBody = data
        return originalSend.call(this, data)
    }

    // Log khi response hoàn thành
    res.on('finish', () => {
        const duration = Date.now() - startTime
        const methodColor = getColorByMethod(req.method)
        const statusColor = getColorByStatus(res.statusCode)
        const resetColor = '\x1b[0m'
        const boldColor = '\x1b[1m'

        console.log('\n' + '='.repeat(80))
        console.log(
            `${boldColor}${methodColor}${req.method}${resetColor} ${req.originalUrl || req.url} ${statusColor}[${res.statusCode}]${resetColor} ${duration}ms`
        )
        console.log('='.repeat(80))

        // Request Info
        console.log(`${boldColor}📥 REQUEST:${resetColor}`)

        // Query params
        if (req.query && Object.keys(req.query).length > 0) {
            console.log(`  Query:`, JSON.stringify(req.query, null, 2))
        }

        // Request body
        const bodyData = formatRequestBody(req)
        if (bodyData) {
            console.log(`  Body:`, JSON.stringify(bodyData, null, 2))
        }

        // Files
        if (req.files || req.file) {
            const filesInfo = formatFiles(req.files || req.file)
            console.log(`  Files:`, JSON.stringify(filesInfo, null, 2))
        }

        // Headers (chỉ show một số quan trọng)
        const importantHeaders = {
            'content-type': req.headers['content-type'],
            authorization: req.headers['authorization'] ? 'Bearer ***' : undefined,
            'user-agent': req.headers['user-agent']
        }
        console.log(`  Headers:`, JSON.stringify(importantHeaders, null, 2))

        // Response Info
        console.log(`\n${boldColor}📤 RESPONSE:${resetColor}`)
        console.log(`  Status: ${statusColor}${res.statusCode}${resetColor}`)

        if (responseBody) {
            try {
                const parsedBody = JSON.parse(responseBody)
                const formattedResponse = formatResponse(parsedBody)
                console.log(`  Data:`, JSON.stringify(formattedResponse, null, 2))
            } catch (e) {
                // Nếu không parse được JSON
                if (typeof responseBody === 'string' && responseBody.length > 200) {
                    console.log(`  Data: [String - ${responseBody.length} chars] ${responseBody.substring(0, 100)}...`)
                } else {
                    console.log(`  Data:`, responseBody)
                }
            }
        }

        console.log('='.repeat(80) + '\n')
    })

    next()
}

export default httpLogger
