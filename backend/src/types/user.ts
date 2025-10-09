import { Document, Types } from 'mongoose'

/**
 * User Role Types
 */
export type UserRole = 'admin' | 'customer' | 'staff'

/**
 * Address Interface
 */
export interface IAddress {
    _id?: Types.ObjectId
    name: string
    phone: string
    addressLine: string
    city: string
    ward: string
    isDefault: boolean
    location: {
        type: 'Point'
        coordinates: [number, number] // [longitude, latitude]
    }
}

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
    addresses: IAddress[]
    createdAt: Date
    updatedAt: Date
    comparePassword(candidatePassword: string): Promise<boolean>
}
