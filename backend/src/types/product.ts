import { Document, Types } from 'mongoose'

/**
 * Product Unit Types
 */
export type ProductUnit = 'kg' | 'gói' | 'chai' | 'hộp' | 'thùng' | 'cái' | 'bó' | 'túi'

/**
 * Product Interface for Document
 */
export interface IProduct extends Document {
    _id: Types.ObjectId
    name: string
    description?: string
    categoryId: Types.ObjectId
    basePrice: number
    price: number
    discountPercent: number
    unit: ProductUnit
    stock: number
    soldCount: number
    images: string[]
    isActive: boolean
    isFeatured: boolean
    createdAt: Date
    updatedAt: Date
}
