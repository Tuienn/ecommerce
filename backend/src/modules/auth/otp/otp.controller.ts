import { OTPService } from '../../index.service'
import { handleSuccess } from '../../../utils/handleRes'
import { registerOTPTemplate, sendMail } from '../../../utils/sendMail'
import { BadRequestError } from '../../../exceptions/error.handler'
import { isValidEmail, isValidPhoneNumber } from '../../../utils/validate'
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

    static async registerPhoneOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone } = req.body

            if (!phone) {
                throw new BadRequestError(missingDataField('phone'))
            }

            if (!isValidPhoneNumber(phone)) {
                throw new BadRequestError(invalidDataField('phone'))
            }

            const otp = await OTPService.registerPhoneOTP(phone)
            if (!otp || !otp.code) {
                throw new BadRequestError('Lỗi khi tạo mã OTP')
            }

            return handleSuccess(res, { code: otp.code, phone: otp.phone }, 'Tạo mã OTP thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async verifyPhoneOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, code } = req.body

            if (!phone || !code) {
                throw new BadRequestError(missingDataField(!phone ? 'phone' : 'code'))
            }

            if (!isValidPhoneNumber(phone)) {
                throw new BadRequestError(invalidDataField('phone'))
            }

            if (code.length !== 6) {
                throw new BadRequestError(invalidDataField('code'))
            }

            const otp = await OTPService.verifyPhoneOTP(phone, code)

            return handleSuccess(res, otp, 'Xác thực mã OTP thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async getVerifyStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone } = req.params

            if (!phone) {
                throw new BadRequestError(missingDataField('phone'))
            }

            if (!isValidPhoneNumber(phone)) {
                throw new BadRequestError(invalidDataField('phone'))
            }

            const result = await OTPService.getVerifyStatus(phone)

            return handleSuccess(res, result, 'Lấy trạng thái xác thực thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default OTPController
