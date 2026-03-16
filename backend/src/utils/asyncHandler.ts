import { Request, Response, NextFunction } from 'express'

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

const asyncHandler = (fn: AsyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next)
    }
}

export default asyncHandler
