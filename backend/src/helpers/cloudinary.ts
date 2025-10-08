import cloudinary from '../configs/cloudinary.config'

/**
 * Xóa ảnh từ Cloudinary dựa trên URL
 * @param imageUrl - URL của ảnh trên Cloudinary
 * @returns Promise<boolean> - true nếu xóa thành công
 */
export const deleteImageFromCloudinary = async (imageUrl: string): Promise<boolean> => {
    try {
        // Extract public_id từ URL Cloudinary
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const urlParts = imageUrl.split('/')
        const uploadIndex = urlParts.findIndex((part) => part === 'upload')

        if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
            console.error('Invalid Cloudinary URL format:', imageUrl)
            return false
        }

        // Lấy phần sau 'upload/v{version}/' và loại bỏ extension
        const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/')
        const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '') // Remove file extension

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
 * Xóa nhiều ảnh từ Cloudinary
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
