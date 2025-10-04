import { ReasonPhrases, StatusCodes } from '../constants/httpStatusCode.js'
import { BadRequestError, isExpectedError } from '../exceptions/error.handler.js'

const handleSuccess = (res, data = null, message = ReasonPhrases.OK, status = StatusCodes.OK) => {
    return res.status(status).json({
        code: status,
        message,
        data
    })
}

const handleError = (err, message = ReasonPhrases.INTERNAL_SERVER_ERROR) => {
    if (isExpectedError(err)) {
        throw err
    }
    console.error('Unexpected error:', err)
    throw new BadRequestError(message)
}

export { handleSuccess, handleError }
