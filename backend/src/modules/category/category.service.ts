import { Category } from '../index.model'
import { ConflictRequestError, NotFoundError } from '../../exceptions/error.handler'
import { ICategory } from '../../types/category'
import { RootFilterQuery } from 'mongoose'
import { existedDataField } from '../../constants/text'

class CategoryService {
    static async createCategory(data: { name: string }) {
        const { name } = data

        // Kiểm tra trùng name
        const existingCategory = await this.checkIsExists({ name })
        if (existingCategory) {
            throw new ConflictRequestError(existedDataField('tên danh mục'))
        }

        // Tạo document mới với isActive: true
        const newCategory = await Category.create({
            name,
            isActive: true
        })

        return newCategory.toObject()
    }

    static async bulkCreateCategories(categories: string[]) {
        const successCategories: string[] = []
        const errorCategories: string[] = []

        // Lấy tất cả categories hiện có để kiểm tra trùng
        const existingCategories = await Category.find({
            name: { $in: categories }
        }).select('name')

        const existingNames = new Set(existingCategories.map((cat) => cat.name))

        // Lọc ra các tên chưa tồn tại
        const newCategories = categories.filter((name) => {
            if (existingNames.has(name)) {
                errorCategories.push(name)
                return false
            }
            return true
        })

        // Loại bỏ duplicate trong mảng input
        const uniqueNewCategories = Array.from(new Set(newCategories))

        // Tạo các category mới
        if (uniqueNewCategories.length > 0) {
            const createdCategories = await Category.insertMany(
                uniqueNewCategories.map((name) => ({
                    name,
                    isActive: true
                }))
            )
            successCategories.push(...createdCategories.map((cat) => cat.name))
        }

        return {
            successCount: successCategories.length,
            successCategories,
            errorCount: errorCategories.length,
            errorCategories
        }
    }

    static async getAllCategories(query?: { page?: number; limit?: number; isActive?: boolean }) {
        const page = query?.page || 1
        const limit = query?.limit || 10
        const filter: any = {}

        if (typeof query?.isActive === 'boolean') {
            filter.isActive = query.isActive
        }

        const categories = await Category.find(filter)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Category.countDocuments(filter)

        return {
            data: categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getCategoryById(categoryId: string) {
        const category = await Category.findById(categoryId)

        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục')
        }

        return category
    }

    static async updateCategory(categoryId: string, data: { name?: string; isActive?: boolean }) {
        const { name, isActive } = data

        const category = await this.getCategoryById(categoryId)

        // Kiểm tra trùng tên nếu có thay đổi name
        if (name && name !== category.name) {
            const existingCategory = await this.checkIsExists({ name })
            if (existingCategory) {
                throw new ConflictRequestError(existedDataField('tên danh mục'))
            }
        }

        // Cập nhật name / isActive
        if (name) category.name = name
        if (typeof isActive === 'boolean') category.isActive = isActive

        await category.save()

        return category.toObject()
    }

    static async deleteCategory(categoryId: string) {
        // Kiểm tra category có tồn tại không
        await this.getCategoryById(categoryId)

        // TODO: Kiểm tra có sản phẩm thuộc category đó không
        // Khi có Product model, uncomment dòng dưới:
        // const hasProducts = await Product.exists({ category: categoryId })
        // if (hasProducts) {
        //     throw new BadRequestError('Không thể xóa danh mục đang có sản phẩm')
        // }

        await Category.findByIdAndDelete(categoryId)
        return true
    }

    static async setCategoryActive(categoryId: string, isActive: boolean) {
        const category = await this.getCategoryById(categoryId)

        category.isActive = !!isActive
        await category.save()

        return category.toObject()
    }

    static async checkIsExists(collections: RootFilterQuery<ICategory>) {
        const category = await Category.exists(collections)
        return !!category
    }
}

export default CategoryService
