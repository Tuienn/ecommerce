import { apiService } from '@/api/api-service'
import { CreateReviewData } from '@/types/review'
import * as FileSystem from 'expo-file-system'

class ReviewService {
    /**
     * Tạo review mới với upload ảnh/video
     */
    static async createReview(data: CreateReviewData, imageUris?: string[]) {
        const formData = new FormData()
        formData.append('orderId', data.orderId)
        formData.append('productId', data.productId)
        formData.append('rating', data.rating.toString())
        if (data.comment) {
            formData.append('comment', data.comment)
        }
        formData.append('type', 'reviews') // For cloudinary folder

        // Append images
        if (imageUris && imageUris.length > 0) {
            for (let i = 0; i < imageUris.length; i++) {
                const uri = imageUris[i]
                const fileInfo = await FileSystem.getInfoAsync(uri)
                if (fileInfo.exists) {
                    const fileName = uri.split('/').pop() || `image_${i}.jpg`
                    const fileType = fileName.split('.').pop() || 'jpg'
                    formData.append('files', {
                        uri,
                        name: fileName,
                        type: `image/${fileType}`
                    } as any)
                }
            }
        }

        return apiService('/review/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    /**
     * Cập nhật review
     */
    static async updateReview(
        reviewId: string,
        data: { rating?: number; comment?: string },
        oldImages?: string[],
        newImageUris?: string[]
    ) {
        const formData = new FormData()

        if (data.rating !== undefined) {
            formData.append('rating', data.rating.toString())
        }
        if (data.comment !== undefined) {
            formData.append('comment', data.comment)
        }
        if (oldImages && oldImages.length > 0) {
            formData.append('oldImages', JSON.stringify(oldImages))
        }
        formData.append('type', 'reviews')

        // Append new images
        if (newImageUris && newImageUris.length > 0) {
            for (let i = 0; i < newImageUris.length; i++) {
                const uri = newImageUris[i]
                const fileInfo = await FileSystem.getInfoAsync(uri)
                if (fileInfo.exists) {
                    const fileName = uri.split('/').pop() || `image_${i}.jpg`
                    const fileType = fileName.split('.').pop() || 'jpg'
                    formData.append('files', {
                        uri,
                        name: fileName,
                        type: `image/${fileType}`
                    } as any)
                }
            }
        }

        return apiService(`/review/${reviewId}/upload`, {
            method: 'PUT',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    /**
     * Lấy reviews theo product (public - không cần auth)
     */
    static async getReviewsByProduct(productId: string, page: number = 1, limit: number = 10) {
        return apiService(`/review/product/${productId}?page=${page}&limit=${limit}`)
    }

    /**
     * Lấy reviews của user hiện tại
     */
    static async getMyReviews(page: number = 1, limit: number = 10) {
        return apiService(`/review/me?page=${page}&limit=${limit}`)
    }

    /**
     * Kiểm tra đã review chưa
     */
    static async checkReviewExists(orderId: string, productId: string) {
        return apiService(`/review/check/${orderId}/${productId}`)
    }

    /**
     * Lấy review theo ID
     */
    static async getReviewById(reviewId: string) {
        return apiService(`/review/${reviewId}`)
    }
}

export default ReviewService
