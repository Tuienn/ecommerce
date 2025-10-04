import { ReasonPhrases, StatusCodes } from '../constants/httpStatusCode'
import { BadRequestError, isExpectedError } from '../exceptions/error.handler'
import { Response } from 'express'

const handleSuccess = (
    res: Response,
    data: any = null,
    message: string = ReasonPhrases.OK,
    status: number = StatusCodes.OK
) => {
    return res.status(status).json({
        code: status,
        message,
        data
    })
}

const handleError = (err: any, message: string = ReasonPhrases.INTERNAL_SERVER_ERROR) => {
    if (isExpectedError(err)) {
        throw err
    }
    console.error('Unexpected error:', err)
    throw new BadRequestError(message)
}

export { handleSuccess, handleError }
