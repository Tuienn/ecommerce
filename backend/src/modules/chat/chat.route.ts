import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import { ChatController } from '../index.controller'

const router: RouterType = Router()

// All routes require authentication
router.use(authenticateToken)

// Create or get chat between users (at least one must be admin)
router.post('/create', asyncHandler(ChatController.createOrGetChat))

// Get current user's chats
router.get('/my-chats', asyncHandler(ChatController.getMyChats))

// Admin routes
router.get('/admin/all-chats', authorize('admin'), asyncHandler(ChatController.getAllChatsAdmin))

// Get chat by ID
router.get('/:chatId', asyncHandler(ChatController.getChatById))

export default router
