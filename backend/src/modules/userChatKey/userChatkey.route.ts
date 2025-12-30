import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import { UserChatKeyController } from '../index.controller'

const router: RouterType = Router()

// All routes require authentication
router.use(authenticateToken)

// Register or update chat keys
router.post('/register', asyncHandler(UserChatKeyController.registerKey))

// Check if current user has chat key
router.get('/me', asyncHandler(UserChatKeyController.hasMyKey))

// Get all users with chat capability
router.get('/users', asyncHandler(UserChatKeyController.getUsersWithKeys))

// Get user's public key
router.get('/:userId/public-key', asyncHandler(UserChatKeyController.getPublicKey))

// Get encrypted private key for recovery
router.get('/:userId/encrypted-key', asyncHandler(UserChatKeyController.getEncryptedKey))

export default router
