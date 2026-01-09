import { CategoryController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import cacheMiddleware from '../../middlewares/cache.middleware'
import cacheEvictMiddleware from '../../middlewares/cacheEvict.middleware'

const router: RouterType = Router()

// Public routes - CACHE
router.get('', cacheMiddleware(1800), asyncHandler(CategoryController.getAllCategories)) // 30 phút
router.get('/:_id', cacheMiddleware(3600), asyncHandler(CategoryController.getCategoryById)) // 1 giờ

// Admin routes - CACHE EVICT
router.post(
    '',
    authenticateToken,
    authorize('admin'),
    asyncHandler(CategoryController.createCategory),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/categories*' })
)
router.post(
    '/bulk',
    authenticateToken,
    authorize('admin'),
    asyncHandler(CategoryController.bulkCreateCategories),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/categories*' })
)
router.put(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    asyncHandler(CategoryController.updateCategoryById),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/categories*',
        keys: [(req) => `cache:GET:/v1/categories/${req.params._id}`]
    })
)
router.delete(
    '/:_id',
    authenticateToken,
    authorize('admin'),
    asyncHandler(CategoryController.deleteCategoryById),
    cacheEvictMiddleware({ pattern: 'cache:GET:/v1/categories*' })
)
router.patch(
    '/:_id/active',
    authenticateToken,
    authorize('admin'),
    asyncHandler(CategoryController.setActiveById),
    cacheEvictMiddleware({
        pattern: 'cache:GET:/v1/categories*',
        keys: [(req) => `cache:GET:/v1/categories/${req.params._id}`]
    })
)

export default router
