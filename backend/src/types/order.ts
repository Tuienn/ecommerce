import { Document, Types } from 'mongoose'
import { IAddress } from './user'

export type OrderStatus = 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'SHIPPING' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type PaymentProvider = 'MOMO' | 'VNPAY'

export interface IOrderItem {
    productId: Types.ObjectId
    name: string
    price: number
    quantity: number
    basePrice: number
    discountPercent: number
}

export interface IPayment {
    provider: PaymentProvider
    amount: number
    status: PaymentStatus
    transactionId?: string
    createdAt?: Date
    updatedAt?: Date
}

export interface IOrder extends Document {
    userId: Types.ObjectId
    items: IOrderItem[]
    total: number
    shippingFee: number
    discountPercent: number
    baseTotal: number
    currency: string
    shippingAddress: IAddress
    status: OrderStatus
    payment: IPayment
    createdAt: Date
    updatedAt: Date
}
