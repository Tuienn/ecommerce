export interface IOrderReview {
    _id: string
    userId: string | { _id: string; name: string }
    orderId: string
    productId: string | { _id: string; name: string; images?: string[]; price?: number }
    rating: number
    comment?: string
    images?: string[]
    isEdited: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateReviewData {
    orderId: string
    productId: string
    rating: number
    comment?: string
}
