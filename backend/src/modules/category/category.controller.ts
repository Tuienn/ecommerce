import { CategoryService } from '../index.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { invalidDataField, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'

class CategoryController {
    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body

            if (!name) {
                throw new BadRequestError(missingDataField('tên danh mục'))
            }

            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new BadRequestError(invalidDataField('tên danh mục'))
            }

            const data = await CategoryService.createCategory({ name: name.trim() })
            return handleSuccess(res, data, 'Tạo danh mục thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    static async bulkCreateCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { categories } = req.body

            if (!categories || !Array.isArray(categories)) {
                throw new BadRequestError(invalidDataField('danh sách danh mục'))
            }

            if (categories.length === 0) {
                throw new BadRequestError('Danh sách danh mục không được rỗng')
            }

            // Validate và trim tất cả tên danh mục
            const validCategories = categories
                .filter((name) => typeof name === 'string' && name.trim().length > 0)
                .map((name) => name.trim())

            if (validCategories.length === 0) {
                throw new BadRequestError('Không có danh mục hợp lệ nào trong danh sách')
            }

            const data = await CategoryService.bulkCreateCategories(validCategories)
            return handleSuccess(res, data, 'Thêm danh mục hàng loạt hoàn tất', StatusCodes.OK)
        } catch (error) {
            next(error)
            return
        }
    }

    static async getAllCategories(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await CategoryService.getAllCategories()
            return handleSuccess(res, data, 'Lấy danh sách danh mục thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id
            const data = await CategoryService.getCategoryById(categoryId)
            return handleSuccess(res, data.toObject(), 'Lấy thông tin danh mục thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async updateCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id
            const { name, isActive } = req.body

            // Validate name nếu có
            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim().length === 0) {
                    throw new BadRequestError(invalidDataField('tên danh mục'))
                }
            }

            // Validate isActive nếu có
            if (isActive !== undefined && typeof isActive !== 'boolean') {
                throw new BadRequestError(invalidDataField('trạng thái'))
            }

            const updateData: { name?: string; isActive?: boolean } = {}
            if (name) updateData.name = name.trim()
            if (typeof isActive === 'boolean') updateData.isActive = isActive

            const data = await CategoryService.updateCategory(categoryId, updateData)
            return handleSuccess(res, data, 'Cập nhật danh mục thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async deleteCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id
            await CategoryService.deleteCategory(categoryId)
            return handleSuccess(res, null, 'Xóa danh mục thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async setActiveById(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id
            const { isActive } = req.body

            if (typeof isActive !== 'boolean') {
                throw new BadRequestError(invalidDataField('trạng thái'))
            }

            const data = await CategoryService.setCategoryActive(categoryId, isActive)
            const message = isActive ? 'Đã bật danh mục' : 'Đã tắt danh mục'
            return handleSuccess(res, data, message)
        } catch (error) {
            next(error)
            return
        }
    }
}

export default CategoryController
