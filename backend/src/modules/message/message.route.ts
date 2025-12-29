import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import { MessageController } from '../index.controller'

const router: RouterType = Router()

// All routes require authentication
router.use(authenticateToken)

// Get messages for a chat (with cursor-based pagination)
router.get('/chat/:chatId', asyncHandler(MessageController.getChatMessages))

// Get messages sent by a user
router.get('/user/:userId', asyncHandler(MessageController.getUserMessages))

export default router
