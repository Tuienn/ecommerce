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
