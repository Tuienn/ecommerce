import { Cart, Product } from '../index.model'
import { BadRequestError, NotFoundError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'
import { CART } from '../../constants/text'

class CartService {
    /**
     * Lấy giỏ hàng hiện tại của user
     */
    static async getCart(userId: string, query?: { page?: number; limit?: number }) {
        const page = query?.page || 1
        const limit = query?.limit || 10

        let cart = await Cart.findOne({ userId })

        // Nếu chưa có giỏ hàng, tạo mới
        if (!cart) {
            cart = await Cart.create({ userId, items: [] })
        }

        // Tính tổng số items
        const total = cart.items.length

        // Phân trang items
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedItems = cart.items.slice(startIndex, endIndex)

        // Populate thông tin sản phẩm cho items đã phân trang
        const populatedCart = await Cart.populate(
            { ...cart.toObject(), items: paginatedItems },
            {
                path: 'items.productId',
                select: 'name price basePrice discountPercent unit stock images isActive'
            }
        )

        return {
            _id: cart._id,
            userId: cart.userId,
            items: populatedCart.items,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    static async addToCart(userId: string, productId: string, quantity: number) {
        // Kiểm tra sản phẩm tồn tại và isActive
        const product = await Product.findById(productId)
        if (!product) {
            throw new NotFoundError(CART.PRODUCT_NOT_FOUND)
        }

        if (!product.isActive) {
            throw new BadRequestError(CART.PRODUCT_INACTIVE)
        }

        // Kiểm tra stock
        if (product.stock < quantity) {
            throw new BadRequestError(`Sản phẩm chỉ còn ${product.stock} ${product.unit}`)
        }

        // Lấy hoặc tạo giỏ hàng
        let cart = await Cart.findOne({ userId })
        if (!cart) {
            cart = await Cart.create({ userId, items: [] })
        }

        // Kiểm tra sản phẩm đã tồn tại trong giỏ chưa
        const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === productId)

        if (existingItemIndex > -1) {
            // Sản phẩm đã tồn tại → tăng số lượng
            const newQuantity = cart.items[existingItemIndex].quantity + quantity

            // Kiểm tra stock sau khi tăng
            if (product.stock < newQuantity) {
                throw new BadRequestError(
                    `Không thể thêm. Sản phẩm chỉ còn ${product.stock} ${product.unit} (trong giỏ đã có ${cart.items[existingItemIndex].quantity})`
                )
            }

            cart.items[existingItemIndex].quantity = newQuantity
        } else {
            // Sản phẩm chưa có → thêm mới
            cart.items.push({
                productId: new Types.ObjectId(productId),
                quantity
            })
        }

        await cart.save()

        return true
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ
     */
    static async updateCartItem(userId: string, productId: string, quantity: number) {
        const cart = await Cart.findOne({ userId })
        if (!cart) {
            throw new NotFoundError(CART.NOT_FOUND)
        }

        const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId)

        if (itemIndex === -1) {
            throw new NotFoundError(CART.ITEM_NOT_FOUND)
        }

        // Nếu quantity = 0 → xóa item
        if (quantity === 0) {
            cart.items.splice(itemIndex, 1)
        } else {
            // Kiểm tra sản phẩm
            const product = await Product.findById(productId)
            if (!product) {
                throw new NotFoundError(CART.PRODUCT_NOT_FOUND)
            }

            if (!product.isActive) {
                throw new BadRequestError(CART.PRODUCT_INACTIVE)
            }

            // Giới hạn quantity theo stock
            const finalQuantity = Math.min(quantity, product.stock)
            cart.items[itemIndex].quantity = finalQuantity
        }

        await cart.save()

        return true
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    static async removeCartItem(userId: string, productId: string) {
        const cart = await Cart.findOne({ userId })
        if (!cart) {
            throw new NotFoundError(CART.NOT_FOUND)
        }

        const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId)

        if (itemIndex === -1) {
            throw new NotFoundError(CART.ITEM_NOT_FOUND)
        }

        cart.items.splice(itemIndex, 1)
        await cart.save()

        return true
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    static async clearCart(userId: string) {
        const cart = await Cart.findOne({ userId })
        if (!cart) {
            throw new NotFoundError(CART.NOT_FOUND)
        }

        cart.items = []
        await cart.save()

        return true
    }

    /**
     * Checkout giỏ hàng - Tính toán tổng tiền cho các sản phẩm được chọn
     */
    static async checkout(userId: string, productIds: string[]) {
        const cart = await Cart.findOne({ userId })
        if (!cart || cart.items.length === 0) {
            throw new BadRequestError(CART.EMPTY)
        }

        const checkoutItems = []
        let totalAmount = 0
        let baseTotalAmount = 0

        // Lọc các items theo productIds
        for (const productId of productIds) {
            const cartItem = cart.items.find((item) => item.productId.toString() === productId)

            if (!cartItem) {
                throw new NotFoundError(`Sản phẩm ${productId} không có trong giỏ hàng`)
            }

            // Lấy thông tin sản phẩm từ database
            const product = await Product.findById(productId)

            if (!product) {
                throw new NotFoundError(CART.PRODUCT_NOT_FOUND)
            }

            // Kiểm tra sản phẩm còn hoạt động
            if (!product.isActive) {
                throw new BadRequestError(`Sản phẩm "${product.name}" đã ngừng kinh doanh`)
            }

            // Kiểm tra stock
            if (product.stock < cartItem.quantity) {
                throw new BadRequestError(`Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit}`)
            }

            // Lấy giá từ Product (tránh sai lệch)
            const itemPriceTotal = product.price * cartItem.quantity
            const basePriceTotal = product.basePrice * cartItem.quantity

            checkoutItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                unit: product.unit,
                total: itemPriceTotal,
                basePrice: product.basePrice,
                baseTotal: basePriceTotal
            })

            totalAmount += itemPriceTotal
            baseTotalAmount += basePriceTotal
        }

        return {
            items: checkoutItems,
            totalAmount,
            baseTotalAmount
        }
    }
}

export default CartService
