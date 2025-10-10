import { OrderController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'

const router: RouterType = Router()

// All routes require authentication
router.use(authenticateToken)

// User routes - authenticated users can access
router.post('', authorize('customer'), asyncHandler(OrderController.createOrder))
router.get('', authorize('customer'), asyncHandler(OrderController.getOrders))
router.get('/simple', authorize('customer'), asyncHandler(OrderController.getSimpleOrders))
router.get('/:id', authorize('customer'), asyncHandler(OrderController.getOrderById))
router.post('/:id/cancel', authorize('customer'), asyncHandler(OrderController.cancelOrder))

// Admin only routes
router.put('/:id/update-order-status', authorize('admin'), asyncHandler(OrderController.updateOrderStatus))
router.put('/:id/verify-bank-status', authorize('admin'), asyncHandler(OrderController.verifyBankStatus))

export default router
