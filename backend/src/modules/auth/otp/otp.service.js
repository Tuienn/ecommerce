import { OTP } from '../../index.model.js'
import { UserService } from '../../index.service.js'
import { randomInt } from 'crypto'
import { OtpError } from '../../../exceptions/error.handler.js'
import { isValidEmail } from '../../../utils/validate.js'
import { generateAccessToken, verifyAccessToken } from '../../../utils/handleJwt.js'

const genOTP6 = () => {
    return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export const registerEmailOTP = async (email) => {
    try {
        if (!isValidEmail(email)) {
            throw new OtpError('Email không hợp lệ')
        }

        const userExists = await UserService.checkIsExists({ email }) // Sử dụng hàm kiểm tra tồn tại từ UserService
        if (userExists) {
            throw new OtpError('Email này đã được sử dụng, vui lòng đăng nhập hoặc sử dụng email khác')
        }

        const code = genOTP6()

        const doc = await OTP.findOneAndUpdate(
            { email },
            {
                code,
                createdAt: new Date(),
                isUsed: false,
                status: 'pending',
                message: ''
            },
            { upsert: true, new: true }
        )
        return doc.toObject()
    } catch (error) {
        if (error instanceof OtpError) throw error
        throw new OtpError('Lỗi khi tạo mã OTP')
    }
}

export const verifyEmailOTP = async (email, code) => {
    if (!isValidEmail(email)) {
        throw new OtpError('Email không hợp lệ')
    }
    if (!code || code.length !== 6) {
        throw new OtpError('Mã OTP không hợp lệ')
    }

    const otpDoc = await OTP.findOne({ email, code })
    if (!otpDoc) {
        throw new OtpError('Mã OTP không hợp lệ')
    }

    let errorMessage = ''
    if (otpDoc.isUsed) {
        errorMessage = 'Mã OTP đã được sử dụng'
    }

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

    return {
        status: otpDoc.status,
        email: otpDoc.email,
        code: otpDoc.code,
        accessToken: generateAccessToken({ email, code })
    }
}

export const checkValidEmailOTPAfterRegister = async (accessToken) => {
    try {
        const otpDecoded = await verifyAccessToken(accessToken)

        if (!otpDecoded || !otpDecoded.email || !otpDecoded.code) {
            return false
        }

        // Tìm và xóa OTP trong 1 lần
        const otpDoc = await OTP.findOneAndDelete({
            email: otpDecoded.email,
            code: otpDecoded.code,
            isUsed: true,
            status: 'success'
        })

        return !!otpDoc // Trả về true nếu tìm thấy và xóa thành công
    } catch (error) {
        console.error('Error in checkValidEmailOTPAfterRegister:', error)
        return false
    }
}
