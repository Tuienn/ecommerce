import { Schema, model } from 'mongoose'
import { IOrder, IOrderItem, IPayment } from '../../types/order'
import { addressSchema } from '../user/user.model'
import mongoosePaginate from 'mongoose-paginate-v2'

const OrderItemSchema = new Schema<IOrderItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true, index: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        basePrice: { type: Number, required: true },
        discountPercent: { type: Number, required: true }
    },
    { _id: false }
)

const PaymentSchema = new Schema<IPayment>(
    {
        provider: { type: String, enum: ['MOMO', 'VNPAY'], required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
        transactionId: { type: String },
        dek: { type: String } // DEK for transactionId encryption
    },
    { _id: false, timestamps: true }
)

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: { type: [OrderItemSchema], required: true },
        total: { type: Number, required: true, index: true },
        shippingFee: { type: Number, default: 20000 },
        discountPercent: { type: Number, default: 0 },
        baseTotal: { type: Number, required: true },
        currency: { type: String, default: 'VND' },
        shippingAddress: addressSchema,
        status: {
            type: String,
            enum: ['PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPING', 'COMPLETED'],
            default: 'PROCESSING'
        },
        payment: PaymentSchema,
        cancelReason: { type: String }
    },
    { timestamps: true }
)

// 👉 Index không gian để hỗ trợ query map
OrderSchema.index({ 'shippingAddress.location': '2dsphere' })
OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ userId: 1, status: 1 })

OrderSchema.plugin(mongoosePaginate)

const Order = model<IOrder>('Order', OrderSchema)

export default Order
