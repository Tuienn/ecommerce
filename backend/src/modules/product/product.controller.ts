import { ProductService } from '../index.service'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { invalidDataField, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'
import { StatusCodes } from '../../constants/httpStatusCode'

class ProductController {
    // Helper: Parse và validate product fields chung
    private static parseProductFields(body: any, isFormData: boolean = false) {
        const {
            name,
            description,
            categoryId,
            basePrice,
            discountPercent,
            unit,
            stock,
            isActive = true,
            isFeatured
        } = body

        // Validate name nếu có
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new BadRequestError(invalidDataField('tên sản phẩm'))
            }
        }

        // Parse và validate basePrice
        let parsedBasePrice: number | undefined
        if (basePrice !== undefined) {
            parsedBasePrice = isFormData ? parseFloat(basePrice) : basePrice
            if (typeof parsedBasePrice !== 'number' || isNaN(parsedBasePrice) || parsedBasePrice < 0) {
                throw new BadRequestError(invalidDataField('giá gốc'))
            }
        }

        // Parse và validate discountPercent
        let parsedDiscountPercent: number | undefined
        if (discountPercent !== undefined) {
            parsedDiscountPercent = isFormData ? parseFloat(discountPercent) : discountPercent
            if (
                typeof parsedDiscountPercent !== 'number' ||
                isNaN(parsedDiscountPercent) ||
                parsedDiscountPercent < 0 ||
                parsedDiscountPercent > 100
            ) {
                throw new BadRequestError(invalidDataField('phần trăm giảm giá'))
            }
        }

        // Parse và validate stock
        let parsedStock: number | undefined
        if (stock !== undefined) {
            parsedStock = isFormData ? parseInt(stock) : stock
            if (typeof parsedStock !== 'number' || isNaN(parsedStock) || parsedStock < 0) {
                throw new BadRequestError(invalidDataField('số lượng tồn kho'))
            }
        }

        // Parse boolean fields
        const parsedIsActive = isActive === 'true' || isActive === true

        let parsedIsFeatured: boolean | undefined
        if (isFeatured !== undefined) {
            parsedIsFeatured = isFormData ? isFeatured === 'true' || isFeatured === true : isFeatured
        }

        // Build update data object
        const updateData: any = {}
        if (name) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description
        if (categoryId) updateData.categoryId = categoryId
        if (parsedBasePrice !== undefined) updateData.basePrice = parsedBasePrice
        if (parsedDiscountPercent !== undefined) updateData.discountPercent = parsedDiscountPercent
        if (unit) updateData.unit = unit
        if (parsedStock !== undefined) updateData.stock = parsedStock
        if (parsedIsActive !== undefined) updateData.isActive = parsedIsActive
        if (parsedIsFeatured !== undefined) updateData.isFeatured = parsedIsFeatured

        return updateData
    }

    // Helper: Xử lý images cho update
    private static handleUpdateImages(body: any, files?: any): string[] | undefined {
        const { images, oldImages } = body

        // Case 1: JSON update với images array
        if (images !== undefined) {
            if (!Array.isArray(images)) {
                throw new BadRequestError(invalidDataField('danh sách hình ảnh'))
            }
            return images
        }

        // Case 2: Form-data update với oldImages + new files
        const resultImages: string[] = []

        // Giữ lại ảnh cũ nếu có
        if (oldImages) {
            try {
                const parsedOldImages = typeof oldImages === 'string' ? JSON.parse(oldImages) : oldImages
                if (Array.isArray(parsedOldImages)) {
                    resultImages.push(...parsedOldImages)
                }
            } catch (error) {
                throw new BadRequestError('oldImages phải là JSON array hợp lệ')
            }
        }

        // Thêm ảnh mới từ upload
        if (files && Array.isArray(files) && files.length > 0) {
            resultImages.push(...files.map((file: any) => file.path))
        }

        return resultImages.length > 0 ? resultImages : undefined
    }
    static async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                name,
                description,
                categoryId,
                basePrice,
                discountPercent,
                unit,
                stock,
                isActive = true,
                isFeatured
            } = req.body

            // Validate required fields
            if (!name || !categoryId || !basePrice) {
                throw new BadRequestError(missingDataField('tên sản phẩm, danh mục hoặc giá gốc'))
            }

            // Validate name
            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new BadRequestError(invalidDataField('tên sản phẩm'))
            }

            // Validate basePrice (form-data trả về string nên cần parse)
            const parsedBasePrice = parseFloat(basePrice)
            if (isNaN(parsedBasePrice) || parsedBasePrice < 0) {
                throw new BadRequestError(invalidDataField('giá gốc'))
            }

            // Validate discountPercent nếu có
            let parsedDiscountPercent = 0
            if (discountPercent) {
                parsedDiscountPercent = parseFloat(discountPercent)
                if (isNaN(parsedDiscountPercent) || parsedDiscountPercent < 0 || parsedDiscountPercent > 100) {
                    throw new BadRequestError(invalidDataField('phần trăm giảm giá'))
                }
            }

            // Validate stock nếu có
            let parsedStock = 0
            if (stock) {
                parsedStock = parseInt(stock)
                if (isNaN(parsedStock) || parsedStock < 0) {
                    throw new BadRequestError(invalidDataField('số lượng tồn kho'))
                }
            }

            // Lấy URLs từ uploaded files
            const images: string[] = []
            if (req.files && Array.isArray(req.files)) {
                images.push(...req.files.map((file: any) => file.path))
            }

            // Parse boolean fields (form-data trả về string)\
            const parsedIsActive = isActive === 'true' || isActive === true
            const parsedIsFeatured = isFeatured === 'true' || isFeatured === true

            const data = await ProductService.createProduct({
                name: name.trim(),
                description: description || '',
                categoryId,
                basePrice: parsedBasePrice,
                discountPercent: parsedDiscountPercent,
                unit: unit || 'kg',
                stock: parsedStock,
                images,
                isActive: parsedIsActive,
                isFeatured: parsedIsFeatured
            })

            return handleSuccess(res, data, 'Tạo sản phẩm thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }
    static async getAllProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
            const isFeatured =
                req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined
            const categoryId = req.query.categoryId as string | undefined

            const data = await ProductService.getAllProducts({ page, limit, isActive, categoryId, isFeatured })
            return handleSuccess(res, data, 'Lấy danh sách sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async searchProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const name = req.query.name as string | undefined
            const isFeatured =
                req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined

            // Parse categoryIds - có thể là array hoặc string "id1,id2"
            let categoryIds: string[] | undefined
            if (req.query.categoryIds) {
                if (typeof req.query.categoryIds === 'string') {
                    // Nếu là string "id1,id2" thì split
                    categoryIds = req.query.categoryIds.split(',').map((id) => id.trim())
                } else if (Array.isArray(req.query.categoryIds)) {
                    // Nếu đã là array
                    categoryIds = req.query.categoryIds as string[]
                }
            }

            // Parse sortPrice
            let sortPrice: 'asc' | 'desc' | undefined
            if (req.query.sortPrice === 'asc' || req.query.sortPrice === 'desc') {
                sortPrice = req.query.sortPrice
            }

            // Parse sortDiscount
            let sortDiscount: 'asc' | 'desc' | undefined
            if (req.query.sortDiscount === 'asc' || req.query.sortDiscount === 'desc') {
                sortDiscount = req.query.sortDiscount
            }

            const data = await ProductService.searchProducts({
                page,
                limit,
                name,
                categoryIds,
                isFeatured,
                sortPrice,
                sortDiscount
            })
            return handleSuccess(res, data, 'Tìm kiếm sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async simpleSearchProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const name = req.query.name as string | undefined
            const isFeatured =
                req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined

            // Parse categoryIds - có thể là array hoặc string "id1,id2"
            let categoryIds: string[] | undefined
            if (req.query.categoryIds) {
                if (typeof req.query.categoryIds === 'string') {
                    // Nếu là string "id1,id2" thì split
                    categoryIds = req.query.categoryIds.split(',').map((id) => id.trim())
                } else if (Array.isArray(req.query.categoryIds)) {
                    // Nếu đã là array
                    categoryIds = req.query.categoryIds as string[]
                }
            }

            // Parse sortPrice
            let sortPrice: 'asc' | 'desc' | undefined
            if (req.query.sortPrice === 'asc' || req.query.sortPrice === 'desc') {
                sortPrice = req.query.sortPrice
            }

            // Parse sortDiscount
            let sortDiscount: 'asc' | 'desc' | undefined
            if (req.query.sortDiscount === 'asc' || req.query.sortDiscount === 'desc') {
                sortDiscount = req.query.sortDiscount
            }

            const data = await ProductService.searchProducts({
                page,
                limit,
                name,
                categoryIds,
                isFeatured,
                sortPrice,
                sortDiscount
            })
            return handleSuccess(res, data, 'Tìm kiếm sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async getProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params._id
            const data = await ProductService.getProductById(productId)
            return handleSuccess(res, data.toObject(), 'Lấy thông tin sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async updateProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params._id

            // Parse và validate tất cả fields (JSON body)
            const updateData = this.parseProductFields(req.body, false)

            // Xử lý images
            const images = this.handleUpdateImages(req.body)
            if (images !== undefined) {
                updateData.images = images
            }

            const data = await ProductService.updateProduct(productId, updateData)
            return handleSuccess(res, data, 'Cập nhật sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async updateProductWithUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params._id

            // Parse và validate tất cả fields (form-data body)
            const updateData = this.parseProductFields(req.body, true)

            // Xử lý images (oldImages + uploaded files)
            const images = this.handleUpdateImages(req.body, req.files)
            if (images !== undefined) {
                updateData.images = images
            }

            const data = await ProductService.updateProduct(productId, updateData)
            return handleSuccess(res, data, 'Cập nhật sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async deleteProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params._id
            await ProductService.deleteProduct(productId)
            return handleSuccess(res, null, 'Xóa sản phẩm thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async setActiveById(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params._id
            const { isActive } = req.body

            if (typeof isActive !== 'boolean') {
                throw new BadRequestError(invalidDataField('trạng thái'))
            }

            const data = await ProductService.setProductActive(productId, isActive)
            const message = isActive ? 'Đã bật sản phẩm' : 'Đã tắt sản phẩm'
            return handleSuccess(res, data, message)
        } catch (error) {
            next(error)
            return
        }
    }
}

export default ProductController
