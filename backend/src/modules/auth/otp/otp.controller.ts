import OTPService from './otp.service'
import { handleSuccess } from '../../../utils/handleRes'
import { registerOTPTemplate, sendMail } from '../../../utils/sendMail'
import { BadRequestError } from '../../../exceptions/error.handler'
import { isValidEmail } from '../../../utils/validate'
import { NextFunction, Request, Response } from 'express'
import { invalidDataField, missingDataField } from '../../../constants/text'

class OTPController {
    static async registerEmailOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body

            if (!email) {
                throw new BadRequestError(missingDataField('email'))
            }

            if (!isValidEmail(email)) {
                throw new BadRequestError(invalidDataField('email'))
            }

            const otp = await OTPService.registerEmailOTP(email)
            if (!otp || !otp.code) {
                throw new BadRequestError('Lỗi khi tạo mã OTP')
            }
            await sendMail(email, 'Chào mừng bạn đến với Winmart', registerOTPTemplate(otp.code))

            return handleSuccess(res, null, 'Gửi mã OTP thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async verifyEmailOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, code } = req.body

            if (!email || !code) {
                throw new BadRequestError(missingDataField(!email ? 'email' : 'code'))
            }

            if (!isValidEmail(email)) {
                throw new BadRequestError(invalidDataField('email'))
            }

            if (code.length !== 6) {
                throw new BadRequestError(invalidDataField('code'))
            }

            const otp = await OTPService.verifyEmailOTP(email, code)

            return handleSuccess(res, otp, 'Xác thực mã OTP thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default OTPController
