import 'express'
import { Types } from 'mongoose'

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: Types.ObjectId
                email: string
                role: 'admin' | 'customer' | 'staff'
                name?: string
                isActive?: boolean
            }
        }
    }
}
