import { Order, OrderReview, Product } from '../index.model'
import { BadRequestError, ConflictRequestError, NotFoundError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'

class ReviewService {
    /**
     * Tạo review mới
     * - Validate order phải COMPLETED
     * - Validate product phải nằm trong order
     */
    static async createReview(data: {
        userId: string
        orderId: string
        productId: string
        rating: number
        comment?: string
        images?: string[]
    }) {
        const { userId, orderId, productId, rating, comment, images } = data

        // 1. Kiểm tra order tồn tại và thuộc về user
        const order = await Order.findOne({
            _id: new Types.ObjectId(orderId),
            userId: new Types.ObjectId(userId)
        })

        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng')
        }

        // 2. Kiểm tra order đã COMPLETED
        if (order.status !== 'COMPLETED') {
            throw new BadRequestError('Chỉ có thể đánh giá đơn hàng đã hoàn thành')
        }

        // 3. Kiểm tra product có trong order
        const productInOrder = order.items.find((item) => item.productId.toString() === productId)

        if (!productInOrder) {
            throw new BadRequestError('Sản phẩm không nằm trong đơn hàng này')
        }

        // 4. Kiểm tra đã review chưa (unique index sẽ catch nhưng ta check để trả message đẹp)
        const existingReview = await OrderReview.findOne({
            userId: new Types.ObjectId(userId),
            orderId: new Types.ObjectId(orderId),
            productId: new Types.ObjectId(productId)
        })

        if (existingReview) {
            throw new ConflictRequestError('Bạn đã đánh giá sản phẩm này trong đơn hàng')
        }

        // 5. Tạo review
        const review = await OrderReview.create({
            userId: new Types.ObjectId(userId),
            orderId: new Types.ObjectId(orderId),
            productId: new Types.ObjectId(productId),
            rating,
            comment,
            images: images || [],
            isEdited: false
        })

        return review.toObject()
    }

    /**
     * Lấy danh sách reviews theo product
     */
    static async getReviewsByProduct(productId: string, query?: { page?: number; limit?: number }) {
        const page = query?.page || 1
        const limit = query?.limit || 10

        // Validate product exists
        const productExists = await Product.exists({ _id: productId })
        if (!productExists) {
            throw new NotFoundError('Không tìm thấy sản phẩm')
        }

        const reviews = await OrderReview.find({ productId: new Types.ObjectId(productId) })
            .populate('userId', 'name email')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await OrderReview.countDocuments({ productId: new Types.ObjectId(productId) })

        // Tính điểm trung bình
        const avgResult = await OrderReview.aggregate([
            { $match: { productId: new Types.ObjectId(productId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ])
        const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0

        return {
            data: reviews,
            avgRating,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    /**
     * Lấy review theo ID
     */
    static async getReviewById(reviewId: string) {
        const review = await OrderReview.findById(reviewId).populate('userId', 'name').populate('productId', 'name images')

        if (!review) {
            throw new NotFoundError('Không tìm thấy đánh giá')
        }

        return review.toObject()
    }

    /**
     * Xóa review (Admin only)
     */
    static async deleteReview(reviewId: string) {
        const review = await OrderReview.findByIdAndDelete(reviewId)
        if (!review) {
            throw new NotFoundError('Không tìm thấy đánh giá')
        }
        return true
    }

    /**
     * Cập nhật review (User chỉ sửa của mình)
     */
    static async updateReview(
        reviewId: string,
        userId: string,
        data: {
            rating?: number
            comment?: string
            images?: string[]
        }
    ) {
        const review = await OrderReview.findOne({
            _id: new Types.ObjectId(reviewId),
            userId: new Types.ObjectId(userId)
        })

        if (!review) {
            throw new NotFoundError('Không tìm thấy đánh giá hoặc bạn không có quyền sửa')
        }

        if (data.rating !== undefined) review.rating = data.rating
        if (data.comment !== undefined) review.comment = data.comment
        if (data.images !== undefined) review.images = data.images
        review.isEdited = true

        await review.save()
        return review.toObject()
    }

    /**
     * Lấy reviews của user (cho user xem lại các review của mình)
     */
    static async getMyReviews(userId: string, query?: { page?: number; limit?: number }) {
        const page = query?.page || 1
        const limit = query?.limit || 10

        const reviews = await OrderReview.find({ userId: new Types.ObjectId(userId) })
            .populate('productId', 'name images price')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await OrderReview.countDocuments({ userId: new Types.ObjectId(userId) })

        return {
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    /**
     * Kiểm tra user đã review product trong order chưa
     */
    static async checkReviewExists(userId: string, orderId: string, productId: string) {
        const review = await OrderReview.findOne({
            userId: new Types.ObjectId(userId),
            orderId: new Types.ObjectId(orderId),
            productId: new Types.ObjectId(productId)
        })

        return {
            hasReviewed: !!review,
            reviewId: review?._id?.toString() || null
        }
    }
}

export default ReviewService
