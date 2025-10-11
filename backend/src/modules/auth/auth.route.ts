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

export default router
