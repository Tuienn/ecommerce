import { useRouter, useLocalSearchParams } from 'expo-router'
import ReviewForm from '@/components/app/review/review-form'

export default function ViewReviewScreen() {
    const router = useRouter()
    const params = useLocalSearchParams<{ reviewId: string }>()
    const reviewId = Array.isArray(params.reviewId) ? params.reviewId[0] : params.reviewId

    return (
        <ReviewForm
            mode='view'
            reviewId={reviewId}
            orderId=''
            productId=''
            productName=''
        />
    )
}

