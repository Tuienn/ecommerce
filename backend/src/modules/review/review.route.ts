import { ReviewController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import upload from '../../middlewares/uploadCloudinary.middleware'
import { cacheMiddleware } from '../../middlewares/cache.middleware'
import { cacheEvictMiddleware } from '../../middlewares/cacheEvict.middleware'

const router: RouterType = Router()

// Public routes - CACHE
router.get(
    '/product/:productId',
    cacheMiddleware(600), // 10 phút
    asyncHandler(ReviewController.getReviewsByProduct)
)

// Customer routes - CACHE EVICT
router.post(
    '/upload',
    authenticateToken,
    authorize('customer'),
    upload.array('files', 5),
    asyncHandler(ReviewController.createReview),
    cacheEvictMiddleware({
        // Xóa cache reviews của product này
        keys: [(req) => `cache:GET:/v1/reviews/product/${req.body.productId}`]
    })
)

// Customer routes - Lấy reviews của mình
router.get('/me', authenticateToken, authorize('customer'), asyncHandler(ReviewController.getMyReviews))

// Customer routes - Kiểm tra đã review chưa
router.get(
    '/check/:orderId/:productId',
    authenticateToken,
    authorize('customer'),
    asyncHandler(ReviewController.checkReviewExists)
)

// Customer routes - Lấy review theo ID
router.get('/:_id', authenticateToken, authorize('customer'), asyncHandler(ReviewController.getReviewById))

// Customer routes - Cập nhật review với upload ảnh/video mới
router.put(
    '/:_id/upload',
    authenticateToken,
    authorize('customer'),
    upload.array('files', 5),
    asyncHandler(ReviewController.updateReview),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/reviews/product/*' // Xóa tất cả review cache
    })
)

router.delete(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    asyncHandler(ReviewController.deleteReview),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/reviews/product/*'
    })
)

export default router
