import { model, Schema } from 'mongoose'
import { ICart, ICartItem } from '../../types/cart'
import mongoosePaginate from 'mongoose-paginate-v2'

const cartItemSchema = new Schema<ICartItem>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    { _id: false }
)

const cartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        items: {
            type: [cartItemSchema],
            default: []
        }
    },
    { timestamps: true }
)

cartSchema.plugin(mongoosePaginate)
const Cart = model<ICart>('Cart', cartSchema)

export default Cart
