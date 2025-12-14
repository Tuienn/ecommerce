import { useState, useEffect } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { Text } from '@/components/ui/text'
import { Star } from 'lucide-react-native'
import ReviewService from '@/services/review.service'
import { IOrderReview } from '@/types/review'
import ReviewItem from './review-item'
import { useAuth } from '@/hooks/use-auth'

interface ReviewListProps {
    productId: string
}

export default function ReviewList({ productId }: ReviewListProps) {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<IOrderReview[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [avgRating, setAvgRating] = useState(0)
    const [totalReviews, setTotalReviews] = useState(0)

    useEffect(() => {
        fetchReviews(true)
    }, [productId])

    const fetchReviews = async (isInitial: boolean = false) => {
        if (!hasMore && !isInitial) return

        try {
            if (isInitial) {
                setLoading(true)
                setPage(1)
            } else {
                setLoadingMore(true)
            }

            const currentPage = isInitial ? 1 : page + 1
            const response = await ReviewService.getReviewsByProduct(productId, currentPage, 10)

            if (isInitial) {
                setReviews(response.data.data)
            } else {
                setReviews((prev) => [...prev, ...response.data.data])
            }

            setAvgRating(response.data.avgRating)
            setTotalReviews(response.data.pagination.total)
            setPage(currentPage)
            setHasMore(currentPage < response.data.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchReviews(false)
        }
    }

    const renderRatingStars = () => {
        const fullStars = Math.floor(avgRating)
        const hasHalfStar = avgRating % 1 >= 0.5

        return (
            <View className='flex-row items-center gap-1'>
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= fullStars
                    const isHalf = star === fullStars + 1 && hasHalfStar

                    return (
                        <Star
                            key={star}
                            size={16}
                            color='#fbbf24'
                            fill={isFilled || isHalf ? '#fbbf24' : 'transparent'}
                        />
                    )
                })}
                <Text className='ml-1 text-sm font-semibold text-gray-900'>
                    {avgRating.toFixed(1)} ({totalReviews})
                </Text>
            </View>
        )
    }

    const renderHeader = () => (
        <View className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <Text className='mb-2 text-base font-bold text-gray-900'>Đánh giá sản phẩm</Text>
            {totalReviews > 0 ? (
                renderRatingStars()
            ) : (
                <Text className='text-sm text-gray-500'>Chưa có đánh giá nào</Text>
            )}
        </View>
    )

    const renderFooter = () => {
        if (!loadingMore) return null
        return (
            <View className='py-4'>
                <ActivityIndicator color='#16a34a' />
            </View>
        )
    }

    if (loading) {
        return (
            <View className='py-8'>
                <ActivityIndicator size='large' color='#16a34a' />
            </View>
        )
    }

    // Get current user's reviews
    const myReviews = reviews.filter((review) => {
        if (typeof review.userId === 'string') return false
        return review.userId.name === user?.name
    })

    // Get other reviews
    const otherReviews = reviews.filter((review) => {
        if (typeof review.userId === 'string') return true
        return review.userId.name !== user?.name
    })

    // Combine: my reviews first, then others
    const sortedReviews = [...myReviews, ...otherReviews]

    return (
        <View className='px-4 pb-4'>
            {renderHeader()}
            <FlatList
                data={sortedReviews}
                renderItem={({ item }) => {
                    const isMyReview =
                        typeof item.userId !== 'string' && user?.name !== undefined && item.userId.name === user.name
                    return (
                        <View className='mb-3'>
                            <ReviewItem review={item} isMyReview={isMyReview} />
                        </View>
                    )
                }}
                keyExtractor={(item) => item._id}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                scrollEnabled={false}
            />
        </View>
    )
}
