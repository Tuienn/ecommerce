import { useRouter, useLocalSearchParams } from 'expo-router'
import ReviewForm from '@/components/app/review/review-form'

export default function CreateReviewScreen() {
    const router = useRouter()
    const params = useLocalSearchParams<{
        orderId: string
        productId: string
        productName: string
    }>()

    // Decode product name nếu có encode
    // Params có thể là string hoặc array, cần xử lý cả 2 trường hợp
    const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId
    const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId
    const rawProductName = Array.isArray(params.productName) ? params.productName[0] : params.productName
    const productName = rawProductName ? decodeURIComponent(rawProductName) : ''

    return (
        <ReviewForm
            mode='create'
            orderId={orderId}
            productId={productId}
            productName={productName}
            onSuccess={() => router.back()}
        />
    )
}
