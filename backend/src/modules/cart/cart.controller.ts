import CartService from './cart.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { missingDataField, invalidDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'

class CartController {
    /**
     * GET /api/cart - Lấy giỏ hàng hiện tại
     */
    static async getCarts(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const productName = req.query.productName as string | undefined

            const data = await CartService.getCarts(userId, { page, limit, productName })
            return handleSuccess(res, data, 'Lấy giỏ hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * POST /api/cart/add - Thêm sản phẩm vào giỏ
     */
    static async addToCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            const { productId, quantity } = req.body

            if (!productId || !quantity) {
                throw new BadRequestError(missingDataField('productId hoặc quantity'))
            }

            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestError(invalidDataField('productId'))
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new BadRequestError(invalidDataField('quantity'))
            }

            await CartService.addToCart(userId, productId, quantity)
            return handleSuccess(res, null, 'Thêm sản phẩm vào giỏ hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * PATCH /api/cart/item/:_id - Cập nhật số lượng sản phẩm
     */
    static async updateCartItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            const productId = req.params._id

            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestError(invalidDataField('productId'))
            }

            const { quantity } = req.body

            if (quantity === undefined || quantity === null) {
                throw new BadRequestError(missingDataField('quantity'))
            }

            if (!Number.isInteger(quantity) || quantity < 0) {
                throw new BadRequestError(invalidDataField('quantity'))
            }

            await CartService.updateCartItem(userId, productId, quantity)
            const message = quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Cập nhật số lượng thành công'
            return handleSuccess(res, null, message)
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * DELETE /api/cart/item/:_id - Xóa sản phẩm khỏi giỏ
     */
    static async removeCartItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            const productId = req.params._id

            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestError(invalidDataField('productId'))
            }

            await CartService.removeCartItem(userId, productId)
            return handleSuccess(res, null, 'Xóa sản phẩm khỏi giỏ hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * DELETE /api/cart/clear - Xóa toàn bộ giỏ hàng
     */
    static async clearCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            await CartService.clearCart(userId)
            return handleSuccess(res, null, 'Đã xóa toàn bộ giỏ hàng')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * POST /api/cart/checkout - Checkout giỏ hàng
     */
    static async checkout(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError('Không tìm thấy thông tin người dùng')
            }

            const { productIds } = req.body

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                throw new BadRequestError(missingDataField('productIds (mảng)'))
            }

            // Validate tất cả productIds
            for (const productId of productIds) {
                if (!Types.ObjectId.isValid(productId)) {
                    throw new BadRequestError(invalidDataField(`productId: ${productId}`))
                }
            }

            const data = await CartService.checkout(userId, productIds)
            return handleSuccess(res, data, 'Tính toán giỏ hàng thành công', StatusCodes.OK)
        } catch (error) {
            next(error)
            return
        }
    }
}

export default CartController
