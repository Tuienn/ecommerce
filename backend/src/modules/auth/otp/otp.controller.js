import { OTPService } from '../../index.service.js'
import { handleSuccess } from '../../../utils/handleRes.js'
import { registerOTPTemplate, sendMail } from '../../../utils/sendMail.js'
import { BadRequestError } from '../../../exceptions/error.handler.js'

export const registerEmailOTP = async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new BadRequestError('Thiếu thông tin email')
    }

    const otp = await OTPService.registerEmailOTP(email)
    await sendMail(email, 'Chào mừng bạn đến với Winmart', registerOTPTemplate(otp.code))

    return handleSuccess(res, null, 'Gửi mã OTP thành công')
}

export const verifyEmailOTP = async (req, res) => {
    const { email, code } = req.body

    if (!email || !code) {
        throw new BadRequestError('Thiếu thông tin email hoặc mã OTP')
    }

    const otp = await OTPService.verifyEmailOTP(email, code)

    return handleSuccess(res, otp, 'Xác thực mã OTP thành công')
}
