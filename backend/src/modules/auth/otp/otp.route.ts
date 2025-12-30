import { OTPController } from '../../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../../helpers/asyncHandler'
import { limiter } from '../../../middlewares/rateLimiter.middleware'

const router: RouterType = Router()

router.post('/register/email', limiter(1 * 60 * 1000, 5), asyncHandler(OTPController.registerEmailOTP))
router.post('/verify/email', asyncHandler(OTPController.verifyEmailOTP))

router.post('/register/phone', limiter(1 * 60 * 1000, 5), asyncHandler(OTPController.registerPhoneOTP))
router.post('/verify/phone', asyncHandler(OTPController.verifyPhoneOTP))
router.get('/verify-status/:phone', asyncHandler(OTPController.getVerifyStatus))

export default router
