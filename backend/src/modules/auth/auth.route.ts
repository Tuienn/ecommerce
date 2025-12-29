import { AuthController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'

const router: RouterType = Router()

router.post('/login/email', asyncHandler(AuthController.loginByEmail))
router.post('/refresh-token', asyncHandler(AuthController.refreshToken))
router.post('/logout', asyncHandler(AuthController.logout))
router.post('/register', asyncHandler(AuthController.registerUser))
router.get('', authenticateToken, asyncHandler(AuthController.getCurrentUser))

// Google Auth Routes
router.post('/google/check', asyncHandler(AuthController.checkGoogleAccount))
router.post('/google/register', asyncHandler(AuthController.registerWithGoogle))
router.post('/google/login', asyncHandler(AuthController.loginWithGoogle))

export default router
