import { Order, Product, User } from '../index.model'
import { BadRequestError, NotFoundError } from '../../exceptions/error.handler'
import { IOrderItem, OrderStatus, PaymentStatus } from '../../types/order'
import { Types } from 'mongoose'

class OrderService {
    static async createOrder(data: {
        userId: string
        items: any[]
        shippingAddress: any
        payment: { provider: string; amount: number }
    }) {
        const { userId, items, shippingAddress, payment } = data

        // Fetch user để lấy thông tin địa chỉ
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }

        // Tìm địa chỉ từ danh sách addresses của user
        const addressId = typeof shippingAddress === 'string' ? shippingAddress : shippingAddress._id
        const userAddress = user.addresses.find((addr) => addr._id?.toString() === addressId)

        if (!userAddress) {
            throw new BadRequestError('Địa chỉ giao hàng không hợp lệ')
        }

        // Validate và tính toán items
        const orderItems: IOrderItem[] = []
        let baseTotal = 0
        const shippingFee = 20000 // Default shipping fee

        for (const item of items) {
            // Lấy thông tin product từ database
            const product = await Product.findById(item.productId)
            if (!product) {
                throw new NotFoundError(`Không tìm thấy sản phẩm với ID: ${item.productId}`)
            }

            if (!product.isActive) {
                throw new BadRequestError(`Sản phẩm ${product.name} hiện không khả dụng`)
            }

            if (product.stock < item.quantity) {
                throw new BadRequestError(`Sản phẩm ${product.name} không đủ số lượng trong kho`)
            }

            const itemTotal = product.price * item.quantity
            baseTotal += itemTotal

            orderItems.push({
                productId: new Types.ObjectId(item.productId),
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                basePrice: product.price,
                discountPercent: 0 // Default no discount
            })
        }

        // Tính toán total với shipping fee
        const discountPercent = 0 // Default no discount
        const total = baseTotal + shippingFee

        // Tạo order với full address object
        const newOrder = await Order.create({
            userId: new Types.ObjectId(userId),
            items: orderItems,
            total,
            shippingFee,
            discountPercent,
            baseTotal,
            currency: 'VND',
            shippingAddress: {
                name: userAddress.name,
                phone: userAddress.phone,
                addressLine: userAddress.addressLine,
                city: userAddress.city,
                ward: userAddress.ward,
                isDefault: userAddress.isDefault,
                location: userAddress.location
            },
            status: 'PROCESSING',
            payment: {
                provider: payment.provider,
                amount: total,
                status: 'PENDING'
            }
        })

        // Cập nhật stock của products
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
        }

        return newOrder.toObject()
    }

    static async getOrders(query: { userId: string; page?: number; limit?: number; status?: string }) {
        const { userId, page = 1, limit = 10, status } = query
        const filter: any = { userId: new Types.ObjectId(userId) }

        if (status) {
            filter.status = status
        }

        const orders = await Order.find(filter)
            .populate('items.productId', 'name images')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Order.countDocuments(filter)

        return {
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getOrderById(orderId: string) {
        const order = await Order.findById(orderId)
            .populate('items.productId', 'name images price')
            .populate('userId', 'name email')

        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        return order.toObject()
    }

    static async updateOrderStatus(orderId: string, status: OrderStatus) {
        const order = await Order.findById(orderId)
        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        // Validate status transition logic
        const currentStatus = order.status
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            PROCESSING: ['PAID', 'FAILED', 'CANCELLED'],
            PAID: ['SHIPPING', 'CANCELLED'],
            FAILED: ['PROCESSING', 'CANCELLED'],
            CANCELLED: [], // Cannot transition from cancelled
            SHIPPING: ['COMPLETED', 'FAILED'],
            COMPLETED: [] // Cannot transition from completed
        }

        if (!validTransitions[currentStatus].includes(status)) {
            throw new BadRequestError(`Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`)
        }

        order.status = status
        await order.save()

        return order.toObject()
    }

    static async verifyBankStatus(orderId: string, paymentStatus: PaymentStatus, transactionId?: string) {
        const order = await Order.findById(orderId)
        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        // Không cho phép update nếu payment status đã là SUCCESS
        if (order.payment.status === 'SUCCESS') {
            throw new BadRequestError('Thanh toán đã được xác nhận thành công, không thể cập nhật')
        }

        // Update payment status
        order.payment.status = paymentStatus
        if (transactionId) {
            order.payment.transactionId = transactionId
        }

        // Nếu payment thành công, update order status thành PAID
        if (paymentStatus === 'SUCCESS') {
            order.status = 'PAID'
        } else if (paymentStatus === 'FAILED') {
            order.status = 'FAILED'
        }

        await order.save()

        return order.toObject()
    }

    static async cancelOrder(orderId: string) {
        const order = await Order.findById(orderId)
        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        // Chỉ cho phép hủy khi status = PROCESSING hoặc PAID
        if (!['PROCESSING', 'PAID'].includes(order.status)) {
            throw new BadRequestError('Chỉ có thể hủy đơn hàng ở trạng thái PROCESSING hoặc PAID')
        }

        // Update status
        order.status = 'CANCELLED'
        order.payment.status = 'CANCELLED'
        await order.save()

        // Hoàn trả stock cho các products
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
        }

        return order.toObject()
    }

    static async checkOrderExists(orderId: string) {
        const order = await Order.exists({ _id: orderId })
        return !!order
    }
}

export default OrderService
