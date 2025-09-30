const { authController } = require('../index.controller')
const { Router } = require('express')
const asyncHandler = require('../../helpers/asyncHandler')
const authenticateToken = require('../../middlewares/auth.middleware')

const router = Router()

router.post('/login', asyncHandler(authController.login))
router.post('/refresh-token', asyncHandler(authController.refreshToken))
router.post('/logout', asyncHandler(authController.logout))
router.get('', authenticateToken, asyncHandler(authController.getCurrentUser))

module.exports = router
