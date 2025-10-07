import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { IUser } from '../../types/user'
import { comparePassword, hashPassword } from '../../utils/crypto'

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
