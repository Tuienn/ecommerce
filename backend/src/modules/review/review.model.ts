import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

export interface IOrderReview {
    userId: Schema.Types.ObjectId
    orderId: Schema.Types.ObjectId
    productId: Schema.Types.ObjectId

    rating: number // 1 → 5
    comment?: string

    images?: string[]

    isEdited: boolean
}

const OrderReviewSchema = new Schema<IOrderReview>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true },

        images: { type: [String], default: [] },

        isEdited: { type: Boolean, default: false }
    },
    { timestamps: true }
)

/**
 * 🚫 1 user chỉ review 1 lần cho 1 product trong 1 order
 */
OrderReviewSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true })

OrderReviewSchema.plugin(mongoosePaginate)

const OrderReview = model<IOrderReview>('OrderReview', OrderReviewSchema)

export default OrderReview
