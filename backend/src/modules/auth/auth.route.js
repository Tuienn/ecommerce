import * as authController from './auth.controller.js'
import { Router } from 'express'
import asyncHandler from '../../helpers/asyncHandler.js'
import authenticateToken from '../../middlewares/auth.middleware.js'

const router = Router()

router.post('/login', asyncHandler(authController.login))
router.post('/refresh-token', asyncHandler(authController.refreshToken))
router.post('/logout', asyncHandler(authController.logout))
router.get('', authenticateToken, asyncHandler(authController.getCurrentUser))

export default router
