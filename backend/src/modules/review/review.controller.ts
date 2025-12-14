import ReviewService from './review.service'
import { StatusCodes } from '../../constants/httpStatusCode'
import { handleSuccess } from '../../utils/handleRes'
import { Request, Response, NextFunction } from 'express'
import { invalidDataField, missingDataField, AUTH } from '../../constants/text'
import { BadRequestError } from '../../exceptions/error.handler'
import { Types } from 'mongoose'

class ReviewController {
    /**
     * POST /api/review - Tạo review mới (với upload ảnh/video)
     */
    static async createReview(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const { orderId, productId, rating, comment } = req.body

            // Validate required fields
            if (!orderId || !productId || !rating) {
                throw new BadRequestError(missingDataField('orderId, productId hoặc rating'))
            }

            // Validate ObjectIds
            if (!Types.ObjectId.isValid(orderId)) {
                throw new BadRequestError(invalidDataField('orderId'))
            }
            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestError(invalidDataField('productId'))
            }

            // Validate rating (form-data trả về string)
            const parsedRating = parseInt(rating)
            if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                throw new BadRequestError(invalidDataField('rating (phải từ 1-5)'))
            }

            // Lấy URLs từ uploaded files
            const images: string[] = []
            if (req.files && Array.isArray(req.files)) {
                images.push(...req.files.map((file: any) => file.path))
            }

            const data = await ReviewService.createReview({
                userId,
                orderId,
                productId,
                rating: parsedRating,
                comment,
                images
            })

            return handleSuccess(res, data, 'Đánh giá thành công', StatusCodes.CREATED)
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * GET /api/review/product/:productId - Lấy danh sách reviews của sản phẩm
     */
    static async getReviewsByProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.productId

            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestError(invalidDataField('productId'))
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

            const data = await ReviewService.getReviewsByProduct(productId, { page, limit })
            return handleSuccess(res, data, 'Lấy danh sách đánh giá thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * GET /api/review/me - Lấy danh sách reviews của user
     */
    static async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const page = req.query.page ? parseInt(req.query.page as string) : 1
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

            const data = await ReviewService.getMyReviews(userId, { page, limit })
            return handleSuccess(res, data, 'Lấy danh sách đánh giá thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * PUT /api/review/:_id - Cập nhật review (user chỉ sửa của mình)
     */
    static async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id?.toString()
            if (!userId) {
                throw new BadRequestError(AUTH.USER_NOT_FOUND)
            }

            const reviewId = req.params._id
            if (!Types.ObjectId.isValid(reviewId)) {
                throw new BadRequestError(invalidDataField('reviewId'))
            }

            const { rating, comment, oldImages } = req.body

            // Validate rating nếu có
            let parsedRating: number | undefined
            if (rating !== undefined) {
                parsedRating = parseInt(rating)
                if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                    throw new BadRequestError(invalidDataField('rating (phải từ 1-5)'))
                }
            }

            // Xử lý images (oldImages + new uploads)
            const images: string[] = []
            if (oldImages) {
                try {
                    const parsedOldImages = typeof oldImages === 'string' ? JSON.parse(oldImages) : oldImages
                    if (Array.isArray(parsedOldImages)) {
                        images.push(...parsedOldImages)
                    }
                } catch {
                    throw new BadRequestError('oldImages phải là JSON array hợp lệ')
                }
            }
            if (req.files && Array.isArray(req.files)) {
                images.push(...req.files.map((file: any) => file.path))
            }

            const data = await ReviewService.updateReview(reviewId, userId, {
                rating: parsedRating,
                comment,
                images: images.length > 0 ? images : undefined
            })

            return handleSuccess(res, data, 'Cập nhật đánh giá thành công')
        } catch (error) {
            next(error)
            return
        }
    }

    /**
     * DELETE /api/review/:_id - Xóa review (Admin only)
     */
    static async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = req.params._id

            if (!Types.ObjectId.isValid(reviewId)) {
                throw new BadRequestError(invalidDataField('reviewId'))
            }

            await ReviewService.deleteReview(reviewId)
            return handleSuccess(res, null, 'Xóa đánh giá thành công')
        } catch (error) {
            next(error)
            return
        }
    }
}

export default ReviewController
