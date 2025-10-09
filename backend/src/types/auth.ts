import { Document, Types } from 'mongoose'

/**
 * Auth/Token Interface
 */
export interface IAuth extends Document {
    _id: Types.ObjectId
    user: Types.ObjectId
    refreshToken: string
    revokedAt?: Date
    createdAt: Date
    updatedAt: Date
}

/**
 * OTP Status
 */
export type OTPStatus = 'pending' | 'success' | 'failure'

/**
 * OTP Interface
 */
export interface IOTP extends Document {
    _id: Types.ObjectId
    email?: string
    phone?: string
    code: string
    isUsed: boolean
    status: OTPStatus
    message: string
    createdAt: Date
}
