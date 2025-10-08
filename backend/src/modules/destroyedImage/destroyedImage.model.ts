import mongoose from 'mongoose'

const destroyedImageSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        reason: { type: String, default: 'product_deleted' }, // có thể mở rộng
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
)

destroyedImageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

export default mongoose.model('DestroyedImage', destroyedImageSchema)
