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

/**
 * Category Create/Update DTO
 */
export interface ICategoryDTO {
    name: string
    isActive?: boolean
}

/**
 * Category Response
 */
export interface ICategoryResponse {
    _id: Types.ObjectId
    name: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}
