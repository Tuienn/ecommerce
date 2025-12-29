import { OrderService } from '../index.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { AUTH, invalidDataField, missingDataField } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'

class OrderController {
    static async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { items, shippingAddress, payment } = req.body
            const userId = req.user?._id

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new BadRequestError(missingDataField('danh sách sản phẩm'))
            }

            if (!shippingAddress) {
                throw new BadRequestError(missingDataField('địa chỉ giao hàng'))
            }

            if (!payment || !payment.provider) {
                throw new BadRequestError(missingDataField('thông tin thanh toán'))
            }

            // Validate items
            for (const item of items) {
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    throw new BadRequestError(invalidDataField('thông tin sản phẩm'))
                }
            }

            // Validate payment provider
            if (!['MOMO', 'VNPAY'].includes(payment.provider)) {
                throw new BadRequestError(invalidDataField('nhà cung cấp thanh toán'))
            }

            const orderData = {
                userId: userId.toString(),
                items,
                shippingAddress,
                payment: {
                    provider: payment.provider,
                    amount: payment.amount || 0
                }
            }

            const data = await OrderService.createOrder(orderData)
            return handleSuccess(res, data, 'Tạo đơn hàng thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    static async getOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const status = req.query.status as string

            const data = await OrderService.getOrders({ userId: userId.toString(), page, limit, status })
            return handleSuccess(res, data, 'Lấy danh sách đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async getSimpleOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id

            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const status = req.query.status as string

            const data = await OrderService.getOrders({ userId: userId.toString(), page, limit, status })
            return handleSuccess(res, data, 'Lấy danh sách đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async getOrderById(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.id

            const data = await OrderService.getOrderById(orderId)
            return handleSuccess(res, data, 'Lấy thông tin đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    // Admin: Lấy tất cả đơn hàng
    static async getAllOrdersAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
            const status = req.query.status as string
            const userId = req.query.userId as string

            const data = await OrderService.getAllOrdersAdmin({ page, limit, status, userId })
            return handleSuccess(res, data, 'Lấy danh sách đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.id
            const { status } = req.body

            if (!status) {
                throw new BadRequestError(missingDataField('trạng thái đơn hàng'))
            }

            const validStatuses = ['PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPING', 'COMPLETED']
            if (!validStatuses.includes(status)) {
                throw new BadRequestError(invalidDataField('trạng thái đơn hàng'))
            }

            const data = await OrderService.updateOrderStatus(orderId, status)
            return handleSuccess(res, data, 'Cập nhật trạng thái đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async verifyBankStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.id
            const { paymentStatus, transactionId } = req.body

            if (!paymentStatus) {
                throw new BadRequestError(missingDataField('trạng thái thanh toán'))
            }

            const validPaymentStatuses = ['PENDING', 'SUCCESS', 'FAILED']
            if (!validPaymentStatuses.includes(paymentStatus)) {
                throw new BadRequestError(invalidDataField('trạng thái thanh toán'))
            }

            const data = await OrderService.verifyBankStatus(orderId, paymentStatus, transactionId)
            return handleSuccess(res, data, 'Xác minh thanh toán thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    static async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.id
            const { cancelReason } = req.body

            const data = await OrderService.cancelOrder(orderId, cancelReason)
            return handleSuccess(res, data, 'Hủy đơn hàng thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default OrderController
