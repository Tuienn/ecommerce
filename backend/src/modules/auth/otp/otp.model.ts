import { Schema, model } from 'mongoose'
import { OTP_TTL_SECONDS } from '../../../constants/common'

const OTPSchema = new Schema({
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    code: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: OTP_TTL_SECONDS }, // mã OTP tự hết hạn sau 5 phút
    isUsed: { type: Boolean, default: false },
    status: { type: String, enum: ['success', 'pending', 'failure'], default: 'pending' },
    message: { type: String } // lưu thông điệp gửi OTP (nếu cần)
})

// Bắt buộc phải có phone hoặc email
OTPSchema.pre('validate', function (next) {
    if (!this.phone && !this.email) {
        return next(new Error('Phải có phone hoặc email'))
    }
    next()
})

const OTP = model('Otp', OTPSchema)

export default OTP
