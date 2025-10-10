import { CartController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'

const router: RouterType = Router()

// Tất cả routes đều yêu cầu authen và role customer
router.use(authenticateToken)
router.use(authorize('customer'))

// GET /api/cart - Lấy giỏ hàng hiện tại
router.get('', asyncHandler(CartController.getCarts))

// POST /api/cart/add - Thêm sản phẩm vào giỏ
router.post('/add', asyncHandler(CartController.addToCart))

// PATCH /api/cart/item/:_id - Cập nhật số lượng sản phẩm
router.patch('/item/:_id', asyncHandler(CartController.updateCartItem))

// DELETE /api/cart/item/:_id - Xóa sản phẩm khỏi giỏ
router.delete('/item/:_id', asyncHandler(CartController.removeCartItem))

// DELETE /api/cart/clear - Xóa toàn bộ giỏ hàng
router.delete('/clear', asyncHandler(CartController.clearCart))

// POST /api/cart/checkout - Checkout giỏ hàng
router.post('/checkout', asyncHandler(CartController.checkout))

export default router
