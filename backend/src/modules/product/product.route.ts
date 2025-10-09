import { ProductController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'
import upload from '../../middlewares/uploadCloudinary.middleware'

const router: RouterType = Router()

// Public routes
router.get('', asyncHandler(ProductController.getAllProducts))
router.get('/search', asyncHandler(ProductController.searchProducts))
router.get('/simple-search', asyncHandler(ProductController.simpleSearchProducts))
router.get('/:_id', asyncHandler(ProductController.getProductById))

// Protected routes - Admin only
router.post(
    '/upload',
    authenticateToken,
    authorize('admin'),
    upload.array('files', 10),
    asyncHandler(ProductController.createProduct)
)
router.put(
    '/:_id/upload',
    authenticateToken,
    authorize('admin'),
    upload.array('files', 10),
    asyncHandler(ProductController.updateProductWithUpload)
)
router.put('/:_id', authenticateToken, authorize('admin'), asyncHandler(ProductController.updateProductById))
router.delete('/:_id', authenticateToken, authorize('admin'), asyncHandler(ProductController.deleteProductById))
router.patch('/:_id/active', authenticateToken, authorize('admin'), asyncHandler(ProductController.setActiveById))

export default router
