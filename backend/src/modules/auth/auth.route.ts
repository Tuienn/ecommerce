import { AuthController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import { limiter } from '../../middlewares/rateLimiter.middleware'

const router: RouterType = Router()

router.post('/login/email', limiter(1 * 60 * 1000, 5), asyncHandler(AuthController.loginByEmail))
router.post('/refresh-token', asyncHandler(AuthController.refreshToken))
router.post('/logout', asyncHandler(AuthController.logout))
router.post('/register', limiter(1 * 60 * 1000, 5), asyncHandler(AuthController.registerUser))
router.get('', authenticateToken, asyncHandler(AuthController.getCurrentUser))

// Google Auth Routes
router.post('/google/check', asyncHandler(AuthController.checkGoogleAccount))
router.post('/google/register', limiter(1 * 60 * 1000, 5), asyncHandler(AuthController.registerWithGoogle))
router.post('/google/login', limiter(1 * 60 * 1000, 5), asyncHandler(AuthController.loginWithGoogle))

export default router
