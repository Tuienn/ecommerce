import { ReviewController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import upload from '../../middlewares/uploadCloudinary.middleware'

const router: RouterType = Router()

// Public routes
router.get('/product/:productId', asyncHandler(ReviewController.getReviewsByProduct))

// Customer routes - Tạo review với upload ảnh/video
router.post(
    '/upload',
    authenticateToken,
    authorize('customer'),
    upload.array('files', 5), // Max 5 files per review
    asyncHandler(ReviewController.createReview)
)

// Customer routes - Lấy reviews của mình
router.get('/me', authenticateToken, authorize('customer'), asyncHandler(ReviewController.getMyReviews))

// Customer routes - Cập nhật review với upload ảnh/video mới
router.put(
    '/:_id/upload',
    authenticateToken,
    authorize('customer'),
    upload.array('files', 5),
    asyncHandler(ReviewController.updateReview)
)

// Admin routes - Xóa review
router.delete('/:_id', authenticateToken, authorize('admin'), asyncHandler(ReviewController.deleteReview))

export default router
