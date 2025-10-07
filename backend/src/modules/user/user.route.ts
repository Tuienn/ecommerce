import { UserController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'

const router: RouterType = Router()
router.use(authenticateToken)
router.use(authorize('admin'))

router.post('', asyncHandler(UserController.createUser))
router.get('', asyncHandler(UserController.getAllUsers))
router.get('/:_id', asyncHandler(UserController.getUserById))
router.put('/:_id', asyncHandler(UserController.updateUserById))
router.delete('/:_id', asyncHandler(UserController.deleteUserById))
router.patch('/:_id/active', asyncHandler(UserController.setActiveById))

export default router
