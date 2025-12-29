import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import { ChatController } from '../index.controller'

const router: RouterType = Router()

// All routes require authentication
router.use(authenticateToken)

// Create or get chat between users
router.post('/create', asyncHandler(ChatController.createOrGetChat))

// Get current user's chats
router.get('/my-chats', asyncHandler(ChatController.getMyChats))

// Get chat by ID
router.get('/:chatId', asyncHandler(ChatController.getChatById))

export default router
