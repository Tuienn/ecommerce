// cron/destroyedImgCleanup.cron.ts
import cron from 'node-cron'
import { v2 as cloudinary } from 'cloudinary'
import { DestroyedImage } from '../modules/index.model'

// Chạy cron job lúc 0:00 AM mỗi ngày (midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('🕒 [CRON] Bắt đầu dọn ảnh Cloudinary trong destroyed-img collection...')

    // Tìm ảnh đã được tạo hơn 24 giờ trước
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const images = await DestroyedImage.find({ createdAt: { $lt: oneDayAgo } }).limit(500)

    if (images.length === 0) {
        console.log('✅ [CRON] Không có ảnh cần xóa.')
        return
    }

    const publicIds = images.map((i) => i.public_id)

    try {
        // Batch delete — xóa 100 ảnh mỗi request
        const batchSize = 100
        for (let i = 0; i < publicIds.length; i += batchSize) {
            const batch = publicIds.slice(i, i + batchSize)
            const result = await cloudinary.api.delete_resources(batch)
            console.log(`   Xóa batch ${Math.floor(i / batchSize) + 1}: ${batch.length} ảnh`, result.deleted)
        }

        console.log(`🧹 [CRON] Đã xóa ${publicIds.length} ảnh khỏi Cloudinary.`)

        // Xóa record khỏi DB
        const deleteResult = await DestroyedImage.deleteMany({ _id: { $in: images.map((i) => i._id) } })
        console.log(`🗑️  [CRON] Đã xóa ${deleteResult.deletedCount} records khỏi destroyed-img collection.`)
    } catch (err) {
        console.error('❌ [CRON] Lỗi dọn rác Cloudinary:', err)
    }
})

console.log('✅ Cron job "destroyedImgCleanup" đã được thiết lập (chạy lúc 0:00 AM mỗi ngày)')
