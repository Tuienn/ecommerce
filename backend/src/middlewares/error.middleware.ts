import { Request, Response, NextFunction } from 'express'
import { ReasonPhrases, StatusCodes } from '../constants/httpStatusCode'
import mongoose from 'mongoose'

interface CustomError extends Error {
    status?: number
    statusCode?: number
    code?: number | string
}

/**
 * Global error handling middleware
 * Handles both expected and unexpected errors consistently
 */
export const errorMiddleware = (error: CustomError, req: Request, res: Response, _next: NextFunction): void => {
    console.error('🚨 Error::', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code || error.statusCode,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    })

    let statusCode: number =
        typeof error.status === 'number'
            ? error.status
            : typeof error.statusCode === 'number'
              ? error.statusCode
              : typeof error.code === 'number'
                ? error.code
                : StatusCodes.INTERNAL_SERVER_ERROR

    let message: string = error.message || ReasonPhrases.INTERNAL_SERVER_ERROR

    /* ---------------------- Multer Error Handling ---------------------- */
    if (typeof error.code === 'string' && error.code.startsWith('LIMIT')) {
        statusCode = StatusCodes.BAD_REQUEST
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'Kích thước file vượt quá giới hạn cho phép'
                break
            case 'LIMIT_FILE_COUNT':
                message = 'Số lượng file upload vượt quá giới hạn'
                break
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Tên field upload không hợp lệ (LIMIT_UNEXPECTED_FILE)'
                break
            default:
                message = 'Lỗi upload file'
        }
    }

    /* ---------------------- Mongoose CastError ---------------------- */
    if (error instanceof mongoose.Error.CastError && error.path === '_id') {
        statusCode = StatusCodes.BAD_REQUEST
        message = `Giá trị '${error.value}' không phải là ObjectId hợp lệ cho trường '${error.path}'`
    }

    /* ---------------------- Mongoose ValidationError ---------------------- */
    if (error instanceof mongoose.Error.ValidationError) {
        statusCode = StatusCodes.BAD_REQUEST
        message = Object.values(error.errors)
            .map((err: any) => err.message)
            .join(', ')
    }

    /* ---------------------- Duplicate key error ---------------------- */
    if ((error as any).code === 11000) {
        statusCode = StatusCodes.CONFLICT
        const fields = Object.keys((error as any).keyValue).join(', ')
        message = `Giá trị trùng lặp cho các trường: ${fields}`
    }

    /* ---------------------- Đảm bảo statusCode là số ---------------------- */
    if (isNaN(statusCode) || typeof statusCode !== 'number') {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    }

    /* ---------------------- Final response ---------------------- */
    res.status(statusCode).json({
        code: statusCode,
        message,
        data: null,
        ...(process.env.NODE_ENV !== 'production' && {
            stack: error.stack,
            timestamp: new Date().toISOString()
        })
    })
}

/**
 * 404 Not Found middleware
 */
export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const error: CustomError = new Error(`Không tìm thấy đường dẫn ${req.originalUrl} [${req.method}]`)
    error.status = StatusCodes.NOT_FOUND
    next(error)
}
