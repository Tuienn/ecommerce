import OTP from './otp.model.js'
import { randomInt } from 'crypto'
import { OtpError } from '../../../exceptions/error.models.js'
import { isValidEmail } from '../../../utils/validate.js'

const genOTP6 = () => {
    return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export const requestEmailOtp = async (email) => {
    try {
        if (!isValidEmail(email)) {
            throw new OtpError('Email không hợp lệ')
        }
        const code = genOTP6()

        const doc = await OTP.findOneAndUpdate(
            { email },
            {
                code,
                createdAt: new Date(),
                used: false,
                status: 'pending',
                message: ''
            },
            { upsert: true, new: true }
        )
        return doc
    } catch (error) {
        throw new OtpError('Lỗi khi tạo mã OTP')
    }
}

export const verifyEmailOtp = async (email, code) => {
    if (!isValidEmail(email)) {
        throw new OtpError('Email không hợp lệ')
    }
    if (!code || code.length !== 6) {
        throw new OtpError('Mã OTP không hợp lệ')
    }

    // Find OTP record
    const otpDoc = await OTP.findOne({ email, code })
    let errorMessage = ''
    if (!otpDoc) {
        errorMessage = 'Mã OTP không hợp lệ'
    }
    if (otpDoc.isUsed) {
        errorMessage = 'Mã OTP đã được sử dụng'
    }
    // Check if OTP is expired (handled by mongoose TTL index)
    const now = new Date()
    const ageInSeconds = (now - otpDoc.createdAt) / 1000
    if (ageInSeconds > 120) {
        errorMessage = 'Mã OTP đã hết hạn'
    }

    if (errorMessage) {
        otpDoc.status = 'failure'
        otpDoc.message = errorMessage

        await otpDoc.save()
        throw new OtpError(errorMessage)
    }

    otpDoc.isUsed = true
    otpDoc.status = 'success'
    await otpDoc.save()
    return otpDoc
}
