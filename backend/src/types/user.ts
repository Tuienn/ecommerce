import { Document, Types } from 'mongoose'

/**
 * User Role Types
 */
export type UserRole = 'admin' | 'customer' | 'staff'

/**
 * User Interface for Document
 */
export interface IUser extends Document {
    _id: Types.ObjectId
    name: string
    email: string
    password: string
    phone?: string
    role: UserRole
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    comparePassword(candidatePassword: string): Promise<boolean>
}

/**
 * User Create/Update DTO
 */
export interface IUserDTO {
    name: string
    email: string
    password: string
    phone?: string
    role?: UserRole
    isActive?: boolean
}

/**
 * User Response (without password)
 */
export interface IUserResponse {
    _id: Types.ObjectId
    name: string
    email: string
    phone?: string
    role: UserRole
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}
