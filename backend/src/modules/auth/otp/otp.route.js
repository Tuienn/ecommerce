import { OTPController } from '../../index.controller.js'
import { Router } from 'express'
import asyncHandler from '../../../helpers/asyncHandler.js'

const router = Router()

router.post('/register-email-otp', asyncHandler(OTPController.registerEmailOTP))
router.post('/verify-email-otp', asyncHandler(OTPController.verifyEmailOTP))

export default router
