export interface IAddress {
    _id: string
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

export interface IUser {
    _id: string
    name: string
    email: string
    phone?: string
    role: string
    isActive: boolean
    addresses: IAddress[]
    createdAt: string
    updatedAt: string
}
