import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { IProduct } from '../../types/product'

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
            index: true
        },
        description: {
            type: String,
            default: '',
            maxlength: 2000
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true
        },

        // --- Giá và giảm giá ---
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },
        price: {
            type: Number,
            min: 0
        },
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        // --- Đơn vị và số lượng ---
        unit: {
            type: String,
            enum: ['kg', 'gram', 'gói', 'chai', 'hộp', 'thùng', 'cái', 'bó', 'túi'],
            default: 'kg'
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        soldCount: {
            type: Number,
            default: 0,
            min: 0
        },

        // --- Hình ảnh & trạng thái ---
        images: [{ type: String }],
        isActive: {
            type: Boolean,
            default: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

// Index cho tìm kiếm nhanh
productSchema.index({ name: 'text', description: 'text' }) // search
productSchema.index({ categoryId: 1, isFeatured: 1 }) // filter nhanh
productSchema.index({ price: 1 }) // sort giá
productSchema.index({ discountPercent: 1 }) // sort giảm giá
productSchema.index({ createdAt: -1 }) // sort mặc định

// --- Middleware tự động tính giá giảm (nếu discountPercent > 0) ---
productSchema.pre('save', function (next) {
    if (this.discountPercent > 0) {
        this.price = Math.round(this.basePrice * (1 - this.discountPercent / 100))
    } else {
        this.price = this.basePrice
    }
    next()
})

productSchema.plugin(mongoosePaginate)
const Product = model<IProduct>('Product', productSchema)

export default Product
