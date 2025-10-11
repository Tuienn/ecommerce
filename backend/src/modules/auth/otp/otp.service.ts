import { OTP } from '../../index.model'
import { randomInt } from 'crypto'
import { OtpError } from '../../../exceptions/error.handler'
import { generateAccessToken, verifyAccessToken } from '../../../utils/handleJwt'
import { UserService } from '../../index.service'

class OTPService {
    static #genOTP6() {
        return randomInt(0, 1_000_000).toString().padStart(6, '0')
    }

    static async registerEmailOTP(email: string) {
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
        ).lean()
        return doc
    }

    static async verifyEmailOTP(email: string, code: string) {
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

    static async registerPhoneOTP(phone: string) {
        const userExists = await UserService.checkIsExists({ phone })
        if (userExists) {
            throw new OtpError('Số điện thoại này đã được sử dụng, vui lòng đăng nhập hoặc sử dụng số khác')
        }

        const code = this.#genOTP6()

        const doc = await OTP.findOneAndUpdate(
            { phone },
            {
                code,
                createdAt: new Date(),
                isUsed: false,
                status: 'pending',
                message: ''
            },
            { upsert: true, new: true }
        ).lean()
        return doc
    }

    static async verifyPhoneOTP(phone: string, code: string) {
        const otpDoc = await OTP.findOne({ phone, code })
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
            phone: otpDoc.phone,
            code: otpDoc.code,
            accessToken: generateAccessToken({ phone, code })
        }
    }

    static async getVerifyStatus(phone: string) {
        const otpDoc = await OTP.findOne({
            phone,
            isUsed: true,
            status: 'success'
        })

        if (!otpDoc) {
            return { verified: false }
        }

        const accessToken = generateAccessToken({ phone, code: otpDoc.code })
        return {
            verified: true,
            accessToken
        }
    }

    static async checkValidPhoneOTPAfterRegister(accessToken: string) {
        const otpDecoded: any = verifyAccessToken(accessToken)

        if (!otpDecoded || !otpDecoded.phone || !otpDecoded.code) {
            return false
        }

        // Tìm và xóa OTP trong 1 lần
        const otpDoc = await OTP.findOneAndDelete({
            phone: otpDecoded.phone,
            code: otpDecoded.code,
            isUsed: true,
            status: 'success'
        })

        return !!otpDoc // Trả về true nếu tìm thấy và xóa thành công
    }
}

export default OTPService
