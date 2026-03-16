import { ProductController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../utils/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import upload from '../../middlewares/uploadCloudinary.middleware'
import { cacheMiddleware } from '../../middlewares/cache.middleware'
import { cacheEvictMiddleware } from '../../middlewares/cacheEvict.middleware'

const router: RouterType = Router()

// Public routes - CACHE
router.get('', cacheMiddleware(300), asyncHandler(ProductController.getAllProducts)) // 5 phút
router.get('/search', cacheMiddleware(600), asyncHandler(ProductController.searchProducts)) // 10 phút
router.get('/simple-search', cacheMiddleware(600), asyncHandler(ProductController.simpleSearchProducts)) // 10 phút
router.get('/:_id', cacheMiddleware(3600), asyncHandler(ProductController.getProductById)) // 1 giờ

// Admin routes - CACHE EVICT
router.post(
    '/upload',
    authenticateToken,
    authorize('admin'),
    upload.array('files', 10),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/api/product*' }),
    asyncHandler(ProductController.createProduct)
)
router.put(
    '/:_id/upload',
    authenticateToken,
    authorize('admin'),
    upload.array('files', 10),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/api/product*',
        keys: [(req) => `cache:GET:/v1/api/product/${req.params._id}`]
    }),
    asyncHandler(ProductController.updateProductWithUpload)
)
router.put(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/api/product*',
        keys: [(req) => `cache:GET:/v1/api/product/${req.params._id}`]
    }),
    asyncHandler(ProductController.updateProductById)
)
router.delete(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/api/product*' }),
    asyncHandler(ProductController.deleteProductById)
)
router.patch(
    '/:_id/active',
    authenticateToken,
    authorize('admin'),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/api/product*',
        keys: [(req) => `cache:GET:/v1/api/product/${req.params._id}`]
    }),
    asyncHandler(ProductController.setActiveById)
)

export default router
