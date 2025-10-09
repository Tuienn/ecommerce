import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { IUser, IAddress } from '../../types/user'
import { comparePassword, hashPassword } from '../../utils/crypto'

export const addressSchema = new Schema<IAddress>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        addressLine: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        ward: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    { _id: true }
)

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            maxlength: 100,
            index: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            index: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false // không trả về password khi query
        },
        role: {
            type: String,
            required: true,
            enum: ['admin', 'customer', 'staff'],
            default: 'customer'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        addresses: {
            type: [addressSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    try {
        this.password = await hashPassword(this.password)
        next()
    } catch (error) {
        next(error as Error)
    }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password)
}

userSchema.plugin(mongoosePaginate)
const User = model<IUser>('User', userSchema)

export default User
