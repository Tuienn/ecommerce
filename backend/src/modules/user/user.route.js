import { UserController } from '../index.controller.js'
import { Router } from 'express'
import asyncHandler from '../../helpers/asyncHandler.js'
import authenticateToken from '../../middlewares/auth.middleware.js'
import authorize from '../../middlewares/authorize.middleware.js'

const router = Router()
router.use(authenticateToken)

router.post('', asyncHandler(UserController.createUser))
router.get('', authorize(['admin', 'staff']), asyncHandler(UserController.listUsers))
router.get('/:_id', asyncHandler(UserController.getUserById))
router.put('/:_id', asyncHandler(UserController.updateUserById))
router.delete('/:_id', authorize('admin'), asyncHandler(UserController.deleteUserById))
router.patch('/:_id/active', asyncHandler(UserController.setActiveById))

export default router
