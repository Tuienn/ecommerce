import { ReasonPhrases, StatusCodes } from '../constants/httpStatusCode.js'

const handleSuccess = (res, data = null, message = ReasonPhrases.OK, status = StatusCodes.OK) => {
    return res.status(status).json({
        code: status,
        message,
        data
    })
}

const handleError = (
    res,
    message = ReasonPhrases.INTERNAL_SERVER_ERROR,
    status = StatusCodes.INTERNAL_SERVER_ERROR
) => {
    return res.status(status).json({
        code: status,
        message
    })
}

export { handleSuccess, handleError }
