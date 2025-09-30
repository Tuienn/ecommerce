import { Schema, model } from 'mongoose'

const authSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    revokedAt: {
        type: Date, // lưu thời điểm revoke
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60 // vẫn tự xoá token quá 30 ngày
    }
})

// TTL index cho revokedAt (chỉ có hiệu lực khi revokedAt != null)
authSchema.index({ revokedAt: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 })

const Auth = model('Auth', authSchema)

export default Auth
