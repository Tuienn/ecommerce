import { ProductController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
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
    asyncHandler(ProductController.createProduct),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/products*' })
)
router.put(
    '/:_id/upload',
    authenticateToken,
    authorize('admin'),
    upload.array('files', 10),
    asyncHandler(ProductController.updateProductWithUpload),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/products*',
        keys: [(req) => `cache:GET:/v1/products/${req.params._id}`]
    })
)
router.put(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    asyncHandler(ProductController.updateProductById),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/products*',
        keys: [(req) => `cache:GET:/v1/products/${req.params._id}`]
    })
)
router.delete(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    asyncHandler(ProductController.deleteProductById),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/products*' })
)
router.patch(
    '/:_id/active',
    authenticateToken,
    authorize('admin'),
    asyncHandler(ProductController.setActiveById),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/products*',
        keys: [(req) => `cache:GET:/v1/products/${req.params._id}`]
    })
)

export default router
