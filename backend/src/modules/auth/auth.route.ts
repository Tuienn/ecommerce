import { AuthController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/auth.middleware'

const router: RouterType = Router()

router.post('/login', asyncHandler(AuthController.login))
router.post('/refresh-token', asyncHandler(AuthController.refreshToken))
router.post('/logout', asyncHandler(AuthController.logout))
router.post('/register-by-email', asyncHandler(AuthController.registerUserByEmail))
router.get('', authenticateToken, asyncHandler(AuthController.getCurrentUser))

export default router
