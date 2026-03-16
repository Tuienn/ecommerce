import multer from 'multer'
import cloudinary from '../configs/cloudinary.config'
import { Request } from 'express'
import { BadRequestError } from '../exceptions/error.handler'

const ALLOWED_FORMATS = ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Custom Multer Storage Engine sử dụng trực tiếp Cloudinary SDK
 * Thay thế hoàn toàn thư viện multer-storage-cloudinary
 */
class CloudinaryStorageEngine implements multer.StorageEngine {
    _handleFile(
        req: Request,
        file: Express.Multer.File,
        cb: (error: any, info?: Partial<Express.Multer.File>) => void
    ) {
        const type = ((req.body?.type || req.query?.type || 'general') as string).trim()
        const folder = `uploads/${type}`

        // Validate file extension
        const ext = file.originalname.split('.').pop()?.toLowerCase() || ''
        if (!ALLOWED_FORMATS.includes(ext)) {
            return cb(
                new BadRequestError(
                    `Định dạng file không hợp lệ: .${ext}. Chỉ chấp nhận: ${ALLOWED_FORMATS.join(', ')}`
                )
            )
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',
                allowed_formats: ALLOWED_FORMATS
            },
            (error, result) => {
                if (error || !result) {
                    return cb(error || new Error('Upload Cloudinary thất bại'))
                }

                // Trả về thông tin file theo chuẩn Multer (file.path = secure_url)
                cb(null, {
                    path: result.secure_url,
                    filename: result.public_id,
                    size: result.bytes
                } as any)
            }
        )

        // Pipe readable stream từ Multer vào Cloudinary upload stream
        file.stream.pipe(uploadStream)
    }

    _removeFile(_req: Request, file: Express.Multer.File, cb: (error: Error | null) => void) {
        // Xóa file trên Cloudinary nếu cần rollback (ví dụ: validation thất bại sau upload)
        const publicId = (file as any).filename
        if (publicId) {
            cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error) => {
                cb(error || null)
            })
        } else {
            cb(null)
        }
    }
}

const upload = multer({
    storage: new CloudinaryStorageEngine(),
    limits: { fileSize: MAX_FILE_SIZE }
})

export default upload
