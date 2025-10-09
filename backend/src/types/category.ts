import { Document, Types } from 'mongoose'

/**
 * Category Interface for Document
 */
export interface ICategory extends Document {
    _id: Types.ObjectId
    name: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}
