import OTPService from '../otp/otp.service.js'
import { handleSuccess } from '../../../utils/handleRes.js'
import { registerOTPTemplate, sendMail } from '../../../utils/sendMail.js'
import { BadRequestError } from '../../../exceptions/error.handler.js'
import { isValidEmail } from '../../../utils/validate.js'

class OTPController {
    static async registerEmailOTP(req, res) {
        const { email } = req.body

        if (!email) {
            throw new BadRequestError('Thiếu thông tin email')
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('Email không hợp lệ')
        }

        const otp = await OTPService.registerEmailOTP(email)
        await sendMail(email, 'Chào mừng bạn đến với Winmart', registerOTPTemplate(otp.code))

        return handleSuccess(res, null, 'Gửi mã OTP thành công')
    }

    static async verifyEmailOTP(req, res) {
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
