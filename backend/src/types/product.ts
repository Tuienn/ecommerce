import { Document, Types } from 'mongoose'

/**
 * Product Unit Types
 */
export type ProductUnit = 'kg' | 'gram' | 'gói' | 'chai' | 'hộp' | 'thùng' | 'cái' | 'bó' | 'túi'

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

/**
 * Product Create/Update DTO
 */
export interface IProductDTO {
    name: string
    description?: string
    categoryId: string
    basePrice: number
    discountPercent?: number
    unit?: ProductUnit
    stock?: number
    images?: string[]
    isActive?: boolean
    isFeatured?: boolean
}

/**
 * Product Response
 */
export interface IProductResponse {
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
