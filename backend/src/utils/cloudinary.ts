import cloudinary from '../configs/cloudinary.config'
import { DestroyedImage } from '../modules/index.model'

/**
 * Extract public_id từ URL Cloudinary
 * @param imageUrl - URL của ảnh trên Cloudinary
 * @returns public_id hoặc null nếu URL không hợp lệ
 */
export const extractPublicIdFromUrl = (imageUrl: string): string | null => {
    try {
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const urlParts = imageUrl.split('/')
        const uploadIndex = urlParts.findIndex((part) => part === 'upload')

        if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
            console.error('Invalid Cloudinary URL format:', imageUrl)
            return null
        }

        // Lấy phần sau 'upload/v{version}/' và loại bỏ extension
        const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/')
        const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '') // Remove file extension

        return publicId
    } catch (error) {
        console.error('Error extracting public_id from URL:', error)
        return null
    }
}

/**
 * Xóa ảnh từ Cloudinary dựa trên URL (sử dụng trong cron job)
 * @param imageUrl - URL của ảnh trên Cloudinary
 * @returns Promise<boolean> - true nếu xóa thành công
 */
export const deleteImageFromCloudinary = async (imageUrl: string): Promise<boolean> => {
    try {
        const publicId = extractPublicIdFromUrl(imageUrl)

        if (!publicId) {
            return false
        }

        // Xóa ảnh từ Cloudinary
        const result = await cloudinary.uploader.destroy(publicId)

        if (result.result === 'ok') {
            console.log(`Successfully deleted image: ${publicId}`)
            return true
        } else {
            console.error(`Failed to delete image: ${publicId}`, result)
            return false
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
        return false
    }
}

/**
 * Lưu ảnh vào destroyed-img collection để xóa sau
 * @param imageUrl - URL của ảnh cần xóa
 * @param reason - Lý do xóa (mặc định: 'product_deleted')
 * @returns Promise<boolean> - true nếu lưu thành công
 */
export const saveImageToDestroyedCollection = async (
    imageUrl: string,
    reason: string = 'product_deleted'
): Promise<boolean> => {
    try {
        const publicId = extractPublicIdFromUrl(imageUrl)

        if (!publicId) {
            return false
        }

        await DestroyedImage.create({
            url: imageUrl,
            public_id: publicId,
            reason
        })

        console.log(`Saved image to destroyed collection: ${publicId}`)
        return true
    } catch (error) {
        console.error('Error saving image to destroyed collection:', error)
        return false
    }
}

/**
 * Lưu nhiều ảnh vào destroyed-img collection
 * @param imageUrls - Array các URL ảnh cần lưu
 * @param reason - Lý do xóa
 * @returns Promise<boolean> - true nếu tất cả ảnh được lưu thành công
 */
export const saveImagesToDestroyedCollection = async (
    imageUrls: string[],
    reason: string = 'product_deleted'
): Promise<boolean> => {
    try {
        const savePromises = imageUrls.map((url) => saveImageToDestroyedCollection(url, reason))
        const results = await Promise.all(savePromises)

        // Trả về true nếu tất cả ảnh được lưu thành công
        return results.every((result) => result === true)
    } catch (error) {
        console.error('Error saving multiple images to destroyed collection:', error)
        return false
    }
}

/**
 * Xóa nhiều ảnh từ Cloudinary (sử dụng trong cron job)
 * @param imageUrls - Array các URL ảnh cần xóa
 * @returns Promise<boolean> - true nếu tất cả ảnh được xóa thành công
 */
export const deleteImagesFromCloudinary = async (imageUrls: string[]): Promise<boolean> => {
    try {
        const deletePromises = imageUrls.map((url) => deleteImageFromCloudinary(url))
        const results = await Promise.all(deletePromises)

        // Trả về true nếu tất cả ảnh được xóa thành công
        return results.every((result) => result === true)
    } catch (error) {
        console.error('Error deleting multiple images from Cloudinary:', error)
        return false
    }
}
