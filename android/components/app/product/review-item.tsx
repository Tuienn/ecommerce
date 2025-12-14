import { View, Image, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Star } from 'lucide-react-native'
import { IOrderReview } from '@/types/review'

interface ReviewItemProps {
    review: IOrderReview
    isMyReview?: boolean
}

export default function ReviewItem({ review, isMyReview = false }: ReviewItemProps) {
    const userName = typeof review.userId === 'string' ? 'User' : review.userId.name
    const userEmail =
        typeof review.userId === 'object' &&
        review.userId !== null &&
        'email' in review.userId &&
        typeof review.userId.email === 'string'
            ? review.userId.email
            : undefined

    const reviewDate = new Date(review.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })

    const renderStars = () => {
        return (
            <View className='flex-row gap-0.5'>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                        fill={star <= review.rating ? '#fbbf24' : 'transparent'}
                    />
                ))}
            </View>
        )
    }

    return (
        <View
            className={`rounded-lg border p-3 ${
                isMyReview ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
            }`}
        >
            {/* Header */}
            <View className='flex-row items-start justify-between'>
                <View className='flex-1'>
                    <View className='flex-row items-center gap-2'>
                        <Text className='font-semibold text-gray-900'>{userName}</Text>
                        {isMyReview && (
                            <View className='rounded bg-green-600 px-2 py-0.5'>
                                <Text className='text-xs font-medium text-white'>Đánh giá của bạn</Text>
                            </View>
                        )}
                    </View>
                    {userEmail && <Text className='mt-0.5 text-xs text-gray-500'>{userEmail}</Text>}
                    <View className='mt-1 flex-row items-center gap-2'>
                        {renderStars()}
                        <Text className='text-xs text-gray-500'>• {reviewDate}</Text>
                        {review.isEdited && <Text className='text-xs text-gray-400'>(đã chỉnh sửa)</Text>}
                    </View>
                </View>
            </View>

            {/* Comment */}
            {review.comment && (
                <Text className='mt-2 text-sm text-gray-700' style={{ lineHeight: 20 }}>
                    {review.comment}
                </Text>
            )}

            {/* Images */}
            {review.images && review.images.length > 0 && (
                <View className='mt-3 flex-row flex-wrap gap-2'>
                    {review.images.map((image, index) => (
                        <TouchableOpacity key={index} activeOpacity={0.8}>
                            <Image source={{ uri: image }} className='h-20 w-20 rounded-lg' resizeMode='cover' />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}
