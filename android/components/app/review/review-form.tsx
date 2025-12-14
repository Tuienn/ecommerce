import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Star, X, ChevronLeft, Camera } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import ReviewService from '@/services/review.service'
import { showNotification } from '@/lib/utils'
import { ReviewMode, IOrderReview } from '@/types/review'

interface ReviewFormProps {
    mode: ReviewMode
    orderId: string
    productId: string
    productName: string
    reviewId?: string
    onSuccess?: () => void
}

export default function ReviewForm({
    mode,
    orderId: initialOrderId,
    productId: initialProductId,
    productName: initialProductName,
    reviewId,
    onSuccess
}: ReviewFormProps) {
    const router = useRouter()

    const [orderId, setOrderId] = useState(initialOrderId)
    const [productId, setProductId] = useState(initialProductId)
    const [productName, setProductName] = useState(initialProductName)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [images, setImages] = useState<string[]>([])
    const [loading, setLoading] = useState(mode !== 'create')
    const [submitting, setSubmitting] = useState(false)

    const isReadOnly = mode === 'view'
    const isEdit = mode === 'edit'

    useEffect(() => {
        ;(async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                showNotification('error', 'Cần quyền truy cập thư viện ảnh')
            }
        })()
    }, [])

    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && reviewId) {
            loadReviewData()
        }
    }, [mode, reviewId])

    const loadReviewData = async () => {
        try {
            setLoading(true)
            const response = await ReviewService.getReviewById(reviewId!)
            const review: IOrderReview = response.data

            setRating(review.rating)
            setComment(review.comment || '')
            setImages(review.images || [])

            // Load order and product info from review
            setOrderId(typeof review.orderId === 'string' ? review.orderId : review.orderId)
            const productData = typeof review.productId === 'object' ? review.productId : null
            if (productData) {
                setProductId(productData._id)
                setProductName(productData.name)
            }
        } catch (error: any) {
            console.error('Error loading review:', error)
            showNotification('error', error?.response?.data?.message || 'Không thể tải đánh giá')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const handlePickImage = async () => {
        if (images.length >= 5) {
            showNotification('error', 'Tối đa 5 ảnh')
            return
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 5 - images.length
            })

            if (!result.canceled) {
                const newImages = result.assets.map((asset) => asset.uri)
                setImages([...images, ...newImages])
            }
        } catch (error) {
            console.error('Error picking image:', error)
            showNotification('error', 'Không thể chọn ảnh')
        }
    }

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!orderId || !productId) {
            showNotification('error', 'Thiếu thông tin đơn hàng hoặc sản phẩm')
            return
        }

        if (rating === 0) {
            showNotification('error', 'Vui lòng chọn số sao')
            return
        }

        try {
            setSubmitting(true)

            if (mode === 'create') {
                const reviewData = {
                    orderId,
                    productId,
                    rating,
                    comment: comment.trim() || undefined
                }
                await ReviewService.createReview(reviewData, images.length > 0 ? images : undefined)
                showNotification('success', 'Đánh giá thành công')
            } else if (mode === 'edit') {
                // Phân biệt ảnh cũ (URL từ server) và ảnh mới (local URI)
                const oldImages = images.filter((img) => img.startsWith('http'))
                const newImageUris = images.filter((img) => !img.startsWith('http'))

                await ReviewService.updateReview(
                    reviewId!,
                    { rating, comment: comment.trim() || undefined },
                    oldImages,
                    newImageUris.length > 0 ? newImageUris : undefined
                )
                showNotification('success', 'Cập nhật đánh giá thành công')
            }

            onSuccess?.()
        } catch (error: any) {
            console.error('Error submitting review:', error)
            showNotification('error', error?.response?.data?.message || 'Không thể gửi đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleNavigateToEdit = () => {
        router.push(`/review/edit?reviewId=${reviewId}`)
    }

    if (loading) {
        return (
            <SafeAreaView className='flex-1 items-center justify-center bg-white'>
                <ActivityIndicator size='large' color='#16a34a' />
                <Text className='mt-4 text-gray-600'>Đang tải...</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {/* Header */}
            <View className='border-b border-gray-200 bg-white px-4 pb-4'>
                <View className='flex-row items-center'>
                    <TouchableOpacity onPress={() => router.back()} className='mr-3'>
                        <ChevronLeft size={24} color='#000' />
                    </TouchableOpacity>
                    <View className='flex-1'>
                        <Text className='text-lg font-semibold'>
                            {mode === 'create' ? 'Đánh giá sản phẩm' : mode === 'view' ? 'Chi tiết đánh giá' : 'Sửa đánh giá'}
                        </Text>
                        <Text className='mt-1 text-sm text-gray-600' numberOfLines={1}>
                            {productName}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                <View className='gap-6 p-4'>
                    {/* Rating */}
                    <View className='items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 py-6'>
                        <Text className='text-base font-medium'>Đánh giá của bạn</Text>
                        <View className='flex-row gap-2'>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => !isReadOnly && setRating(star)}
                                    activeOpacity={isReadOnly ? 1 : 0.7}
                                    disabled={isReadOnly}
                                >
                                    <Star
                                        size={40}
                                        color={star <= rating ? '#fbbf24' : '#d1d5db'}
                                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className='text-sm text-gray-600'>
                            {rating === 5
                                ? 'Tuyệt vời'
                                : rating === 4
                                  ? 'Hài lòng'
                                  : rating === 3
                                    ? 'Bình thường'
                                    : rating === 2
                                      ? 'Không hài lòng'
                                      : 'Rất tệ'}
                        </Text>
                    </View>

                    {/* Comment */}
                    <View className='gap-2'>
                        <Text className='text-sm font-medium text-gray-700'>Nhận xét (không bắt buộc)</Text>
                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            placeholder='Chia sẻ trải nghiệm của bạn về sản phẩm...'
                            placeholderTextColor='#9ca3af'
                            multiline
                            numberOfLines={6}
                            textAlignVertical='top'
                            className='min-h-[120px] rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900'
                            maxLength={500}
                            editable={!isReadOnly}
                        />
                        <Text className='text-right text-xs text-gray-500'>{comment.length}/500</Text>
                    </View>

                    {/* Images */}
                    <View className='gap-2'>
                        <Text className='text-sm font-medium text-gray-700'>Hình ảnh ({images.length}/5)</Text>
                        <View className='flex-row flex-wrap gap-3'>
                            {images.map((uri, index) => (
                                <View key={index} className='relative'>
                                    <Image source={{ uri }} className='h-24 w-24 rounded-lg' resizeMode='cover' />
                                    {!isReadOnly && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveImage(index)}
                                            className='absolute -right-2 -top-2 rounded-full bg-red-500 p-1'
                                            activeOpacity={0.7}
                                        >
                                            <X size={16} color='#fff' />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {!isReadOnly && images.length < 5 && (
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className='h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50'
                                    activeOpacity={0.7}
                                >
                                    <Camera size={24} color='#9ca3af' />
                                    <Text className='mt-1 text-xs text-gray-500'>Thêm ảnh</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View className='border-t border-gray-200 bg-white p-4'>
                {mode === 'view' ? (
                    <Button onPress={handleNavigateToEdit} className='w-full bg-blue-600 active:bg-blue-700'>
                        <Text className='text-base font-semibold text-white'>Sửa đánh giá</Text>
                    </Button>
                ) : (
                    <Button
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                        className='w-full bg-green-600 active:bg-green-700'
                    >
                        {submitting ? (
                            <ActivityIndicator color='#fff' />
                        ) : (
                            <Text className='text-base font-semibold text-white'>
                                {mode === 'create' ? 'Gửi đánh giá' : 'Cập nhật đánh giá'}
                            </Text>
                        )}
                    </Button>
                )}
            </View>
        </SafeAreaView>
    )
}

