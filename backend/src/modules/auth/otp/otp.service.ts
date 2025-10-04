import { OTP } from '../../index.model'
import { randomInt } from 'crypto'
import { OtpError } from '../../../exceptions/error.handler'
import { isValidEmail } from '../../../utils/validate'
import { generateAccessToken, verifyAccessToken } from '../../../utils/handleJwt'
import { handleError } from '../../../utils/handleRes'

class OTPService {
    static #genOTP6() {
        return randomInt(0, 1_000_000).toString().padStart(6, '0')
    }

    static async registerEmailOTP(email: string) {
        try {
            if (!isValidEmail(email)) {
                throw new OtpError('Email không hợp lệ')
            }

            // Import động để tránh circular dependency
            const { UserService } = await import('../../index.service')
            const userExists = await UserService.checkIsExists({ email })
            if (userExists) {
                throw new OtpError('Email này đã được sử dụng, vui lòng đăng nhập hoặc sử dụng email khác')
            }

            const code = this.#genOTP6()

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
            handleError(error, 'Đăng ký OTP thất bại')
            return null
        }
    }

    static async verifyEmailOTP(email: string, code: string) {
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
        const createdAt = new Date(otpDoc.createdAt)
        const ageInSeconds = (now.getTime() - createdAt.getTime()) / 1000
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

    static async checkValidEmailOTPAfterRegister(accessToken: string) {
        const otpDecoded: any = verifyAccessToken(accessToken)

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
    }
}

export default OTPService
