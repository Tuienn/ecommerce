import { AuthController } from '../index.controller.js'
import { Router } from 'express'
import asyncHandler from '../../helpers/asyncHandler.js'
import authenticateToken from '../../middlewares/auth.middleware.js'

const router = Router()

router.post('/login', asyncHandler(AuthController.login))
router.post('/refresh-token', asyncHandler(AuthController.refreshToken))
router.post('/logout', asyncHandler(AuthController.logout))
router.post('/register-by-email', asyncHandler(AuthController.registerUserByEmail))
router.get('', authenticateToken, asyncHandler(AuthController.getCurrentUser))

export default router
