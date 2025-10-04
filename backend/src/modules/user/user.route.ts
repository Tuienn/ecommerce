import { UserController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/auth.middleware'
import authorize from '../../middlewares/authorize.middleware'

const router: RouterType = Router()
router.use(authenticateToken)

router.post('', asyncHandler(UserController.createUser))
router.get('', authorize(['admin', 'staff']), asyncHandler(UserController.listUsers))
router.get('/:_id', asyncHandler(UserController.getUserById))
router.put('/:_id', asyncHandler(UserController.updateUserById))
router.delete('/:_id', authorize('admin'), asyncHandler(UserController.deleteUserById))
router.patch('/:_id/active', asyncHandler(UserController.setActiveById))

export default router
