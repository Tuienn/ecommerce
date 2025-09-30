import { Schema, model } from 'mongoose'

const otpSchema = new Schema({
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    code: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: 120 }, // mã OTP tự hết hạn sau 120s
    isUsed: { type: Boolean, default: false },
    status: { type: String, enum: ['success', 'pending', 'failure'], default: 'pending' },
    message: { type: String } // lưu thông điệp gửi OTP (nếu cần)
})

// Bắt buộc phải có phone hoặc email
otpSchema.pre('validate', function (next) {
    if (!this.phone && !this.email) {
        return next(new Error('Phải có phone hoặc email'))
    }
    next()
})

const Otp = model('Otp', otpSchema)

export default Otp
