export type OrderStatus = 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'SHIPPING' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface IOrderItem {
    productId: string | { _id: string; name: string; images?: string[]; price?: number }
    name: string
    price: number
    quantity: number
    basePrice: number
    discountPercent: number
}

export interface IPayment {
    provider: string
    amount: number
    status: PaymentStatus
    transactionId?: string
    createdAt?: Date
    updatedAt?: Date
}

export interface IShippingAddress {
    _id?: string
    name: string
    phone: string
    addressLine: string
    city: string
    ward: string
    isDefault: boolean
    location?: {
        type: 'Point'
        coordinates: [number, number]
    }
}

export interface IOrder {
    _id: string
    userId: string
    items: IOrderItem[]
    total: number
    shippingFee: number
    discountPercent: number
    baseTotal: number
    currency: string
    shippingAddress: IShippingAddress
    status: OrderStatus
    payment: IPayment
    cancelReason?: string
    createdAt: string
    updatedAt: string
}

export interface CreateOrderData {
    items: Array<{
        productId: string
        quantity: number
    }>
    shippingAddress: string
    payment: {
        provider: 'MOMO' | 'VNPAY'
        amount: number
    }
}
