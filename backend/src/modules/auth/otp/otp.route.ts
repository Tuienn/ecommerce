import { OTPController } from '../../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../../helpers/asyncHandler'

const router: RouterType = Router()

router.post('/register-email-otp', asyncHandler(OTPController.registerEmailOTP))
router.post('/verify-email-otp', asyncHandler(OTPController.verifyEmailOTP))

export default router
