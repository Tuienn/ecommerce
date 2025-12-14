import { useRouter, useLocalSearchParams } from 'expo-router'
import ReviewForm from '@/components/app/review/review-form'

export default function EditReviewScreen() {
    const router = useRouter()
    const params = useLocalSearchParams<{ reviewId: string }>()
    const reviewId = Array.isArray(params.reviewId) ? params.reviewId[0] : params.reviewId

    return (
        <ReviewForm
            mode='edit'
            reviewId={reviewId}
            orderId=''
            productId=''
            productName=''
            onSuccess={() => router.back()}
        />
    )
}

