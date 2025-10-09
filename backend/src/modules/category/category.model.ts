import { Schema, model } from 'mongoose'
import { ICategory } from '../../types/category'

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
)

const Category = model<ICategory>('Category', categorySchema)

export default Category
