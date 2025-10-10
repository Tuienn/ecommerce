import { IProduct } from './product'

export interface ICartItem {
    productId: IProduct
    quantity: number
}

export interface ICart {
    _id: string
    userId: string
    items: ICartItem[]
    createdAt: string
    updatedAt: string
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface CheckoutData {
    items: Array<{
        productId: string
        name: string
        price: number
        basePrice: number
        unit: string
        quantity: number
        total: number
        baseTotal: number
    }>
    totalAmount: number
    baseTotalAmount: number
}
