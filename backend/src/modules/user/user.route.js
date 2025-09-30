const { userController } = require('../index.controller')
const { Router } = require('express')
const asyncHandler = require('../../helpers/asyncHandler')
const authenticateToken = require('../../middlewares/auth.middleware')
const authorize = require('../../middlewares/authorize.middleware')

const router = Router()
router.use(authenticateToken)

router.post('', asyncHandler(userController.createUser))
router.get('', authorize(['admin', 'staff']), asyncHandler(userController.listUsers))
router.get('/:_id', asyncHandler(userController.getUserById))
router.put('/:_id', asyncHandler(userController.updateUser))
router.delete('/:_id', authorize('admin'), asyncHandler(userController.deleteUser))
router.patch('/:_id/active', asyncHandler(userController.setActive))

module.exports = router
