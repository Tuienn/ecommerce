import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../configs/cloudinary.config'
import multer from 'multer'

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, _file) => {
        const type = (req.body.type || req.query.type || 'general') as string
        return {
            folder: `uploads/${type}`, // ex: uploads/products
            resource_type: 'auto',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov']
        }
    }
})

const upload = multer({ storage })

export default upload
