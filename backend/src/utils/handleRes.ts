import { ReasonPhrases, StatusCodes } from '../constants/httpStatusCode'
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

export { handleSuccess }
