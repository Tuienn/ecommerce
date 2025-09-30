import * as userController from './user.controller.js'
import { Router } from 'express'
import asyncHandler from '../../helpers/asyncHandler.js'
import authenticateToken from '../../middlewares/auth.middleware.js'
import authorize from '../../middlewares/authorize.middleware.js'

const router = Router()
router.use(authenticateToken)

router.post('', asyncHandler(userController.createUser))
router.get('', authorize(['admin', 'staff']), asyncHandler(userController.listUsers))
router.get('/:_id', asyncHandler(userController.getUserById))
router.put('/:_id', asyncHandler(userController.updateUser))
router.delete('/:_id', authorize('admin'), asyncHandler(userController.deleteUser))
router.patch('/:_id/active', asyncHandler(userController.setActive))

export default router
