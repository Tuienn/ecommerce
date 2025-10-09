import { Document, Types } from 'mongoose'

/**
 * Cart Item Interface
 */
export interface ICartItem {
    productId: Types.ObjectId
    quantity: number
}

/**
 * Cart Interface for Document
 */
export interface ICart extends Document {
    _id: Types.ObjectId
    userId: Types.ObjectId
    items: ICartItem[]
    createdAt: Date
    updatedAt: Date
}
