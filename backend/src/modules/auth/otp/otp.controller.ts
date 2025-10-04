import OTPService from './otp.service'
import { handleSuccess } from '../../../utils/handleRes'
import { registerOTPTemplate, sendMail } from '../../../utils/sendMail'
import { BadRequestError } from '../../../exceptions/error.handler'
import { isValidEmail } from '../../../utils/validate'
import { Request, Response } from 'express'

class OTPController {
    static async registerEmailOTP(req: Request, res: Response) {
        const { email } = req.body

        if (!email) {
            throw new BadRequestError('Thiếu thông tin email')
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('Email không hợp lệ')
        }

        const otp = await OTPService.registerEmailOTP(email)
        if (!otp || !otp.code) {
            throw new BadRequestError('Lỗi khi tạo mã OTP')
        }
        await sendMail(email, 'Chào mừng bạn đến với Winmart', registerOTPTemplate(otp.code))

        return handleSuccess(res, null, 'Gửi mã OTP thành công')
    }

    static async verifyEmailOTP(req: Request, res: Response) {
        const { email, code } = req.body

        if (!email || !code) {
            throw new BadRequestError('Thiếu thông tin email hoặc mã OTP')
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('Email không hợp lệ')
        }

        if (code.length !== 6) {
            throw new BadRequestError('Mã OTP không hợp lệ')
        }

        const otp = await OTPService.verifyEmailOTP(email, code)

        return handleSuccess(res, otp, 'Xác thực mã OTP thành công')
    }
}

export default OTPController
