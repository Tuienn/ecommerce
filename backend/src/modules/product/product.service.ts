import { Product, Category } from '../index.model'
import { NotFoundError, BadRequestError, ConflictRequestError } from '../../exceptions/error.handler'
import { existedDataField } from '../../constants/text'
import { saveImagesToDestroyedCollection } from '../../helpers/cloudinary'

class ProductService {
    static async createProduct(data: {
        name: string
        description?: string
        categoryId: string
        basePrice: number
        discountPercent?: number
        unit?: string
        stock?: number
        images?: string[]
        isActive?: boolean
        isFeatured?: boolean
    }) {
        const { name, categoryId, basePrice } = data

        // Kiểm tra category có tồn tại không
        const categoryExists = await Category.findById(categoryId)
        if (!categoryExists) {
            throw new BadRequestError('Danh mục không tồn tại')
        }

        // Kiểm tra category có active không
        if (!categoryExists.isActive) {
            throw new BadRequestError('Danh mục đã bị vô hiệu hóa')
        }

        // Kiểm tra trùng tên sản phẩm trong cùng category
        const existingProduct = await Product.findOne({ name, categoryId })
        if (existingProduct) {
            throw new ConflictRequestError(existedDataField('tên sản phẩm trong danh mục này'))
        }

        // Tạo sản phẩm mới
        const newProduct = await Product.create({
            name,
            description: data.description || '',
            categoryId,
            basePrice,
            discountPercent: data.discountPercent || 0,
            unit: data.unit || 'kg',
            stock: data.stock || 0,
            images: data.images || [],
            isActive: data.isActive !== undefined ? data.isActive : true,
            isFeatured: data.isFeatured || false
        })

        // Populate category
        await newProduct.populate('categoryId', 'name isActive')

        return newProduct.toObject()
    }
    static async getAllProducts(query?: {
        page?: number
        limit?: number
        isActive?: boolean
        categoryId?: string
        isFeatured?: boolean
    }) {
        const page = query?.page || 1
        const limit = query?.limit || 10
        const filter: any = {}

        if (typeof query?.isActive === 'boolean') {
            filter.isActive = query.isActive
        }

        if (query?.categoryId) {
            filter.categoryId = query.categoryId
        }

        if (typeof query?.isFeatured === 'boolean') {
            filter.isFeatured = query.isFeatured
        }

        const products = await Product.find(filter)
            .populate('categoryId', 'name isActive')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Product.countDocuments(filter)

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async searchProducts(query?: {
        name?: string
        categoryIds?: string[]
        isFeatured?: boolean
        sortPrice?: 'asc' | 'desc'
        sortDiscount?: 'asc' | 'desc'
        page?: number
        limit?: number
    }) {
        const page = query?.page || 1
        const limit = query?.limit || 10
        const filter: any = { isActive: true } // Chỉ tìm sản phẩm đang active

        // Tìm theo tên (regex, case-insensitive)
        if (query?.name) {
            filter.name = { $regex: query.name, $options: 'i' }
        }

        // Lọc theo nhiều danh mục
        if (query?.categoryIds && query.categoryIds.length > 0) {
            filter.categoryId = { $in: query.categoryIds }
        }

        // Lọc theo nổi bật
        if (typeof query?.isFeatured === 'boolean') {
            filter.isFeatured = query.isFeatured
        }

        // Xác định sort
        let sort: any = { createdAt: -1 } // Mặc định sort theo mới nhất

        if (query?.sortPrice) {
            sort = { price: query.sortPrice === 'asc' ? 1 : -1 }
        } else if (query?.sortDiscount) {
            sort = { discountPercent: query.sortDiscount === 'asc' ? 1 : -1 }
        }

        const products = await Product.find(filter)
            .populate('categoryId', 'name isActive')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sort)

        const total = await Product.countDocuments(filter)

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async simpleSearchProducts(query?: {
        name?: string
        categoryIds?: string[]
        isFeatured?: boolean
        sortPrice?: 'asc' | 'desc'
        sortDiscount?: 'asc' | 'desc'
        page?: number
        limit?: number
    }) {
        const page = query?.page || 1
        const limit = query?.limit || 10
        const filter: any = { isActive: true } // Chỉ tìm sản phẩm đang active

        // Tìm theo tên (regex, case-insensitive)
        if (query?.name) {
            filter.name = { $regex: query.name, $options: 'i' }
        }

        // Lọc theo nhiều danh mục
        if (query?.categoryIds && query.categoryIds.length > 0) {
            filter.categoryId = { $in: query.categoryIds }
        }

        // Lọc theo nổi bật
        if (typeof query?.isFeatured === 'boolean') {
            filter.isFeatured = query.isFeatured
        }

        // Xác định sort
        let sort: any = { createdAt: -1 } // Mặc định sort theo mới nhất

        if (query?.sortPrice) {
            sort = { price: query.sortPrice === 'asc' ? 1 : -1 }
        } else if (query?.sortDiscount) {
            sort = { discountPercent: query.sortDiscount === 'asc' ? 1 : -1 }
        }

        const products = await Product.find(filter)
            .select('name basePrice price discountPercent images isFeatured soldCount')
            .populate('categoryId', 'name isActive')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sort)

        const total = await Product.countDocuments(filter)

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getProductById(productId: string) {
        const product = await Product.findById(productId).populate('categoryId', 'name isActive')

        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm')
        }

        return product
    }

    static async updateProduct(
        productId: string,
        data: {
            name?: string
            description?: string
            categoryId?: string
            basePrice?: number
            discountPercent?: number
            unit?: string
            stock?: number
            images?: string[]
            isActive?: boolean
            isFeatured?: boolean
        }
    ) {
        const product = await this.getProductById(productId)

        // Kiểm tra category nếu có thay đổi
        if (data.categoryId && data.categoryId !== product.categoryId.toString()) {
            const categoryExists = await Category.findById(data.categoryId)
            if (!categoryExists) {
                throw new BadRequestError('Danh mục không tồn tại')
            }
        }

        // Validate basePrice và discountPercent
        if (data.basePrice !== undefined && data.basePrice < 0) {
            throw new BadRequestError('Giá gốc không được âm')
        }

        if (data.discountPercent !== undefined && (data.discountPercent < 0 || data.discountPercent > 100)) {
            throw new BadRequestError('Phần trăm giảm giá phải từ 0 đến 100')
        }

        if (data.stock !== undefined && data.stock < 0) {
            throw new BadRequestError('Số lượng tồn kho không được âm')
        }

        // Xử lý cập nhật ảnh - lưu ảnh cũ vào destroyed-img nếu có ảnh mới
        if (data.images) {
            const oldImages = product.images || []
            const newImages = data.images

            // Tìm những ảnh cũ không còn trong danh sách mới
            const imagesToDelete = oldImages.filter((oldImg) => !newImages.includes(oldImg))

            // Lưu ảnh cũ vào destroyed-img collection
            if (imagesToDelete.length > 0) {
                try {
                    const saveResult = await saveImagesToDestroyedCollection(imagesToDelete, 'product_updated')

                    if (!saveResult) {
                        console.warn(
                            `Some old images may not be saved to destroyed collection for product: ${productId}`
                        )
                    }
                } catch (error) {
                    console.error('Error saving old images to destroyed collection:', error)
                }
            }

            product.images = newImages
        }

        // Cập nhật các trường khác
        if (data.name) product.name = data.name
        if (data.description !== undefined) product.description = data.description
        if (data.categoryId) product.categoryId = data.categoryId as any
        if (data.basePrice !== undefined) product.basePrice = data.basePrice
        if (data.discountPercent !== undefined) product.discountPercent = data.discountPercent
        if (data.unit) product.unit = data.unit as any
        if (data.stock !== undefined) product.stock = data.stock
        if (typeof data.isActive === 'boolean') product.isActive = data.isActive
        if (typeof data.isFeatured === 'boolean') product.isFeatured = data.isFeatured

        await product.save()

        // Populate lại category sau khi save
        await product.populate('categoryId', 'name isActive')

        return product.toObject()
    }

    static async deleteProduct(productId: string) {
        // Kiểm tra product có tồn tại không và lấy thông tin product
        const product = await this.getProductById(productId)

        // Lưu ảnh vào destroyed-img collection trước khi xóa product
        if (product.images && product.images.length > 0) {
            try {
                const saveResult = await saveImagesToDestroyedCollection(product.images, 'product_deleted')
                if (!saveResult) {
                    console.warn(`Some images may not be saved to destroyed collection for product: ${productId}`)
                }
            } catch (error) {
                console.error('Error saving images to destroyed collection:', error)
                // Không throw error để không cản trở việc xóa product
            }
        }

        await Product.findByIdAndDelete(productId)

        return true
    }

    static async setProductActive(productId: string, isActive: boolean) {
        const product = await this.getProductById(productId)

        product.isActive = !!isActive
        await product.save()

        return product.toObject()
    }
}

export default ProductService
