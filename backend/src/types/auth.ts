import { Document, Types } from 'mongoose'
import { UserRole } from './user'

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
    email: string
    code: string
    isUsed: boolean
    status: OTPStatus
    message: string
    createdAt: Date
}

/**
 * JWT Payload for Access Token
 */
export interface IJWTAccessPayload {
    userId: Types.ObjectId | string
    email: string
    role: UserRole
}

/**
 * JWT Payload for Refresh Token
 */
export interface IJWTRefreshPayload {
    userId: Types.ObjectId | string
}

/**
 * JWT Payload for OTP Token
 */
export interface IJWTOTPPayload {
    email: string
    code?: string
    isUsed?: boolean
}

/**
 * Login Response
 */
export interface ILoginResponse {
    accessToken: string
    refreshToken: string
    expiredTime: string
    role: UserRole
    name: string
    email: string
}

/**
 * OTP Verification Response
 */
export interface IOTPVerifyResponse {
    status: OTPStatus
    email: string
    code: string
    accessToken: string
}
