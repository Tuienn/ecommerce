import { CategoryController } from '../index.controller'
import { Router, Router as RouterType } from 'express'
import asyncHandler from '../../helpers/asyncHandler'
import authenticateToken from '../../middlewares/authen.middleware'
import authorize from '../../middlewares/authorize.middleware'

const router: RouterType = Router()

// Public routes
router.get('', asyncHandler(CategoryController.getAllCategories))
router.get('/:_id', asyncHandler(CategoryController.getCategoryById))

// Protected routes - Admin only
router.post('', authenticateToken, authorize('admin'), asyncHandler(CategoryController.createCategory))
router.post('/bulk', authenticateToken, authorize('admin'), asyncHandler(CategoryController.bulkCreateCategories))
router.put('/:_id', authenticateToken, authorize('admin'), asyncHandler(CategoryController.updateCategoryById))
router.delete('/:_id', authenticateToken, authorize('admin'), asyncHandler(CategoryController.deleteCategoryById))
router.patch('/:_id/active', authenticateToken, authorize('admin'), asyncHandler(CategoryController.setActiveById))

export default router
