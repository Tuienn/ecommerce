import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { hash, compare } from 'bcryptjs'

const userSchema = new Schema(
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
        this.password = await hash(this.password, 10)
        next()
    } catch (error) {
        next(error)
    }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await compare(candidatePassword, this.password)
}

userSchema.plugin(mongoosePaginate)
const User = model('User', userSchema)

export default User
