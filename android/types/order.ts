export interface IOrderItem {
    productId: string
    name: string
    price: number
    quantity: number
    basePrice: number
    discountPercent: number
}

export interface IPayment {
    provider: string
    amount: number
    status: string
    transactionId?: string
    createdAt?: Date
    updatedAt?: Date
}

export interface IAddress {
    _id?: string
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

export interface IOrder {
    items: IOrderItem[]
    shippingAddress: IAddress
    payment: IPayment
}

export interface IOrderItem {
    productId: string
    quantity: number
}
