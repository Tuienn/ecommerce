import { Order, Product, User, Cart } from '../index.model'
import { BadRequestError, NotFoundError } from '../../exceptions/error.handler'
import { IOrder, IOrderItem, OrderStatus, PaymentStatus } from '../../types/order'
import { Types } from 'mongoose'
import KeyManagementApiService from '../../httpClients/keyManagement/keyManagement.service'

class OrderService {
    /**
     * Helper function để giải mã các trường nhạy cảm trong order
     */
    private static async decryptOrderData(order: IOrder): Promise<any> {
        const decryptedOrder = { ...order }

        // Giải mã shippingAddress
        if (order.shippingAddress?.dek) {
            const decryptedAddress = await KeyManagementApiService.decryptDataByApi(
                {
                    name: order.shippingAddress.name,
                    phone: order.shippingAddress.phone,
                    addressLine: order.shippingAddress.addressLine
                },
                order.shippingAddress.dek
            )
            decryptedOrder.shippingAddress = {
                ...order.shippingAddress,
                name: decryptedAddress.name,
                phone: decryptedAddress.phone,
                addressLine: decryptedAddress.addressLine
            }
        }

        // Giải mã transactionId
        if (order.payment?.dek && order.payment?.transactionId) {
            const decryptedPayment = await KeyManagementApiService.decryptDataByApi(
                { transactionId: order.payment.transactionId },
                order.payment.dek
            )
            decryptedOrder.payment = {
                ...order.payment,
                transactionId: decryptedPayment.transactionId
            }
        }

        return decryptedOrder
    }

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

        // Tạo order với địa chỉ - COPY TRỰC TIẾP từ user (đã được mã hóa sẵn)
        // Không mã hóa lại vì userAddress đã được encrypt với DEK của user
        const newOrder = await Order.create({
            userId: new Types.ObjectId(userId),
            items: orderItems,
            total,
            shippingFee,
            discountPercent,
            baseTotal,
            currency: 'VND',
            shippingAddress: {
                name: userAddress.name, // Đã encrypted sẵn
                phone: userAddress.phone, // Đã encrypted sẵn
                addressLine: userAddress.addressLine, // Đã encrypted sẵn
                city: userAddress.city,
                ward: userAddress.ward,
                isDefault: userAddress.isDefault,
                location: userAddress.location,
                dek: userAddress.dek // Dùng DEK của user
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

        // Xóa các cart items đã được đặt hàng
        const productIds = items.map((item) => new Types.ObjectId(item.productId))

        // Xóa các items từ cart (Cart có structure: { userId, items: [{ productId, quantity }] })
        await Cart.updateOne(
            { userId: new Types.ObjectId(userId) },
            { $pull: { items: { productId: { $in: productIds } } } }
        )

        return newOrder.toObject()
    }

    static async getOrders(query: { userId: string; page?: number; limit?: number; status?: string }) {
        const { userId, page = 1, limit = 10, status } = query
        const filter: any = { userId: new Types.ObjectId(userId) }

        if (status) {
            filter.status = status
        }

        const orders = await Order.find(filter)
            .populate('items.productId')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Order.countDocuments(filter)

        // Giải mã các trường nhạy cảm cho mỗi order
        const decryptedOrders = await Promise.all(orders.map((order) => this.decryptOrderData(order.toObject())))

        return {
            data: decryptedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getSimpleOrders(query: { userId: string; page?: number; limit?: number; status?: string }) {
        const { userId, page = 1, limit = 10, status } = query
        const filter: any = { userId: new Types.ObjectId(userId) }

        if (status) {
            filter.status = status
        }

        const orders = await Order.find(filter)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Order.countDocuments(filter)

        // Giải mã các trường nhạy cảm cho mỗi order
        const decryptedOrders = await Promise.all(orders.map((order) => this.decryptOrderData(order.toObject())))

        return {
            data: decryptedOrders,
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

        return await this.decryptOrderData(order.toObject())
    }

    // Admin: Lấy tất cả đơn hàng
    static async getAllOrdersAdmin(query: { page?: number; limit?: number; status?: string; userId?: string }) {
        const { page = 1, limit = 10, status, userId } = query
        const filter: any = {}

        if (status) {
            filter.status = status
        }

        if (userId) {
            filter.userId = new Types.ObjectId(userId)
        }

        const orders = await Order.find(filter)
            .populate('items.productId', 'name images price')
            .populate('userId', 'name email phone')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await Order.countDocuments(filter)

        // Giải mã các trường nhạy cảm cho mỗi order
        const decryptedOrders = await Promise.all(orders.map((order) => this.decryptOrderData(order.toObject())))

        return {
            data: decryptedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
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

        // Không cho phép chuyển sang PAID nếu thanh toán chưa thành công
        if (status === 'PAID' && order.payment.status !== 'SUCCESS') {
            throw new BadRequestError('Không thể chuyển sang trạng thái PAID khi thanh toán chưa thành công')
        }

        // Nếu chuyển sang COMPLETED, cập nhật soldCount và giảm stock
        if (status === 'COMPLETED' && currentStatus !== 'COMPLETED') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: {
                        soldCount: item.quantity,
                        stock: -item.quantity
                    }
                })
            }
        }

        // Nếu từ COMPLETED chuyển về trạng thái khác (rollback), hoàn lại stock
        if (currentStatus === 'COMPLETED' && status !== 'COMPLETED') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: {
                        soldCount: -item.quantity,
                        stock: item.quantity
                    }
                })
            }
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

        // Mã hóa transactionId nếu có
        if (transactionId) {
            const { encryptedData, encryptedKey } = await KeyManagementApiService.encryptDataByApi({
                transactionId
            })
            order.payment.transactionId = encryptedData.transactionId
            order.payment.dek = encryptedKey
        }

        // Nếu payment thành công, update order status thành PAID
        if (paymentStatus === 'SUCCESS') {
            order.status = 'PAID'
        } else if (paymentStatus === 'FAILED') {
            order.status = 'FAILED'
        }

        await order.save()

        // Giải mã và trả về
        return await this.decryptOrderData(order.toObject())
    }

    static async cancelOrder(orderId: string, cancelReason?: string) {
        const order = await Order.findById(orderId)
        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        // Chỉ cho phép hủy khi status = PROCESSING hoặc PAID
        if (!['PROCESSING', 'PAID'].includes(order.status)) {
            throw new BadRequestError('Chỉ có thể hủy đơn hàng ở trạng thái PROCESSING hoặc PAID')
        }

        // Update status and cancel reason
        order.status = 'CANCELLED'

        if (cancelReason) {
            order.cancelReason = cancelReason
        }
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
