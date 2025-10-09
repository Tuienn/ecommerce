export type ProductUnit = 'kg' | 'gram' | 'gói' | 'chai' | 'hộp' | 'thùng' | 'cái' | 'bó' | 'túi'

export interface IProduct {
    _id: string
    name: string
    description?: string
    categoryId: string
    basePrice: number
    price: number
    discountPercent: number
    unit: ProductUnit
    stock: number
    soldCount: number
    images: string[]
    isActive: boolean
    isFeatured: boolean
    createdAt: string
    updatedAt: string
}

export interface ICategory {
    _id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ProductSearchParams {
    name?: string
    categoryIds?: string[]
    isFeatured?: boolean
    sortDiscount?: 'asc' | 'desc'
    sortPrice?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export interface FilterState {
    searchTerm: string
    categoryIds: string[]
    isFeatured?: boolean
    sortPrice?: 'asc' | 'desc'
    sortDiscount?: 'asc' | 'desc'
}

export interface ProductSearchResponse {
    data: IProduct[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}
