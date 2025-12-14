import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IOrder, IOrderItem } from '@/types/order'
import { formatPrice } from '@/lib/format'
import { getStatusInfo } from './order-item'
import { useRouter } from 'expo-router'
import { Star, Eye, Edit } from 'lucide-react-native'
import ReviewService from '@/services/review.service'
import { CheckReviewResponse } from '@/types/review'

interface OrderDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: IOrder | null
}

const getPaymentStatusInfo = (status: string) => {
    const statusMap = {
        PENDING: { label: 'Chờ thanh toán', color: 'text-orange-600' },
        PAID: { label: 'Đã thanh toán', color: 'text-green-600' },
        FAILED: { label: 'Thất bại', color: 'text-red-600' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'text-gray-600' }
}

export default function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
    const router = useRouter()
    const [reviewStatuses, setReviewStatuses] = useState<Record<string, CheckReviewResponse>>({})
    const [loadingReviews, setLoadingReviews] = useState(true)

    // Chỉ hiển thị nút đánh giá khi đơn hàng đã hoàn thành
    const canReview = order?.status === 'COMPLETED'

    // Fetch review status khi mở dialog
    useEffect(() => {
        if (open && canReview && order) {
            checkReviewStatuses()
        }
    }, [open, canReview, order?._id])

    // Early return AFTER all hooks
    if (!order) return null

    const statusInfo = getStatusInfo(order.status)
    const paymentStatusInfo = getPaymentStatusInfo(order.payment.status)
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const checkReviewStatuses = async () => {
        if (!order) return

        setLoadingReviews(true)
        const statuses: Record<string, CheckReviewResponse> = {}

        for (const item of order.items) {
            const productId = typeof item.productId === 'string' ? item.productId : item.productId._id
            try {
                const response = await ReviewService.checkReviewExists(order._id, productId)
                statuses[productId] = response.data
            } catch (error) {
                console.error('Error checking review:', error)
                statuses[productId] = { hasReviewed: false, reviewId: null }
            }
        }

        setReviewStatuses(statuses)
        setLoadingReviews(false)
    }

    const handleCreateReview = (item: IOrderItem) => {
        // Lấy productId - có thể là string hoặc object
        const productId = typeof item.productId === 'string' ? item.productId : item.productId._id
        const productName = item.name

        // Đóng dialog trước
        onOpenChange(false)

        // Đợi dialog đóng hoàn toàn rồi mới navigate
        setTimeout(() => {
            // Encode params để tránh lỗi với ký tự đặc biệt
            const encodedProductName = encodeURIComponent(productName)
            router.push(`/review/create?orderId=${order._id}&productId=${productId}&productName=${encodedProductName}`)
        }, 300)
    }

    const handleViewReview = (reviewId: string) => {
        onOpenChange(false)
        setTimeout(() => {
            router.push(`/review/view?reviewId=${reviewId}`)
        }, 300)
    }

    const handleEditReview = (reviewId: string) => {
        onOpenChange(false)
        setTimeout(() => {
            router.push(`/review/edit?reviewId=${reviewId}`)
        }, 300)
    }

    const renderReviewButtons = (item: IOrderItem) => {
        const productId = typeof item.productId === 'string' ? item.productId : item.productId._id
        const status = reviewStatuses[productId]

        if (loadingReviews) {
            return (
                <View className='mt-3 items-center py-2'>
                    <ActivityIndicator size='small' color='#16a34a' />
                </View>
            )
        }

        if (!status?.hasReviewed) {
            // Chưa review - hiển thị nút Đánh giá
            return (
                <TouchableOpacity
                    onPress={() => handleCreateReview(item)}
                    className='mt-3 flex-row items-center justify-center gap-2 rounded-md border border-green-600 bg-green-50 py-2 active:bg-green-100'
                    activeOpacity={0.7}
                >
                    <Star size={16} color='#16a34a' />
                    <Text className='text-sm font-medium text-green-600'>Đánh giá</Text>
                </TouchableOpacity>
            )
        }

        // Đã review - hiển thị 2 nút
        return (
            <View className='mt-3 flex-row gap-2'>
                <TouchableOpacity
                    onPress={() => handleViewReview(status.reviewId!)}
                    className='flex-1 flex-row items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-50 py-2 active:bg-blue-100'
                    activeOpacity={0.7}
                >
                    <Eye size={16} color='#2563eb' />
                    <Text className='text-sm font-medium text-blue-600'>Xem</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleEditReview(status.reviewId!)}
                    className='flex-1 flex-row items-center justify-center gap-2 rounded-md border border-orange-600 bg-orange-50 py-2 active:bg-orange-100'
                    activeOpacity={0.7}
                >
                    <Edit size={16} color='#ea580c' />
                    <Text className='text-sm font-medium text-orange-600'>Sửa</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='w-[90vw]'>
                <DialogHeader>
                    <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                    <DialogDescription>Mã đơn: #{order._id.slice(-8).toUpperCase()}</DialogDescription>
                </DialogHeader>

                <ScrollView showsVerticalScrollIndicator={false} className='max-h-[500px]'>
                    <View className='gap-4'>
                        {/* Status */}
                        <View className='gap-2'>
                            <Text className='text-sm font-medium text-gray-700'>Trạng thái đơn hàng</Text>
                            <View className='flex-row items-center justify-between'>
                                <Badge className={statusInfo.color}>
                                    <Text className='text-black'>{statusInfo.label}</Text>
                                </Badge>
                                <Text className='text-xs text-gray-500'>{orderDate}</Text>
                            </View>
                        </View>

                        {/* Items List */}
                        <View className='gap-2'>
                            <Text className='text-sm font-medium text-gray-700'>Sản phẩm</Text>
                            {order.items.map((item, index) => (
                                <View key={index} className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                                    <Text className='font-medium text-gray-900'>{item.name}</Text>
                                    <View className='mt-2 flex-row items-center justify-between'>
                                        <Text className='text-sm text-gray-600'>
                                            {formatPrice(item.price)} x {item.quantity}
                                        </Text>
                                        <Text className='font-semibold text-green-600'>
                                            {formatPrice(item.price * item.quantity)}
                                        </Text>
                                    </View>
                                    {item.discountPercent > 0 && (
                                        <View className='mt-1 flex-row items-center gap-2'>
                                            <Text className='text-xs text-gray-400 line-through'>
                                                {formatPrice(item.basePrice * item.quantity)}
                                            </Text>
                                            <Text className='text-xs text-red-500'>-{item.discountPercent}%</Text>
                                        </View>
                                    )}
                                    {canReview && renderReviewButtons(item)}
                                </View>
                            ))}
                        </View>

                        {/* Shipping Address */}
                        <View className='gap-2'>
                            <Text className='text-sm font-medium text-gray-700'>Địa chỉ giao hàng</Text>
                            <View className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                                <Text className='font-medium text-gray-900'>{order.shippingAddress.name}</Text>
                                <Text className='mt-1 text-sm text-gray-600'>{order.shippingAddress.phone}</Text>
                                <Text className='mt-1 text-sm text-gray-600'>
                                    {order.shippingAddress.addressLine}, {order.shippingAddress.ward},{' '}
                                    {order.shippingAddress.city}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Info */}
                        <View className='gap-2'>
                            <Text className='text-sm font-medium text-gray-700'>Thanh toán</Text>
                            <View className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                                <View className='flex-row items-center justify-between'>
                                    <Text className='text-sm text-gray-600'>Phương thức:</Text>
                                    <Text className='font-medium text-gray-900'>{order.payment.provider}</Text>
                                </View>
                                <View className='mt-2 flex-row items-center justify-between'>
                                    <Text className='text-sm text-gray-600'>Trạng thái:</Text>
                                    <Text className={`font-medium ${paymentStatusInfo.color}`}>
                                        {paymentStatusInfo.label}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Total Summary */}
                        <View className='gap-2 rounded-lg border border-green-200 bg-green-50 p-3'>
                            {order.baseTotal > order.total - order.shippingFee && (
                                <View className='flex-row justify-between'>
                                    <Text className='text-sm text-gray-600'>Tổng giá gốc:</Text>
                                    <Text className='text-sm text-gray-400 line-through'>
                                        {formatPrice(order.baseTotal)}
                                    </Text>
                                </View>
                            )}
                            <View className='flex-row justify-between'>
                                <Text className='text-sm text-gray-600'>Tổng sản phẩm:</Text>
                                <Text className='text-sm font-semibold text-gray-900'>
                                    {formatPrice(order.total - order.shippingFee)}
                                </Text>
                            </View>
                            <View className='flex-row justify-between'>
                                <Text className='text-sm text-gray-600'>Phí vận chuyển:</Text>
                                <Text className='text-sm font-semibold text-gray-900'>
                                    {formatPrice(order.shippingFee)}
                                </Text>
                            </View>
                            {order.discountPercent > 0 && (
                                <View className='flex-row justify-between'>
                                    <Text className='text-sm text-gray-600'>Giảm giá:</Text>
                                    <Text className='text-sm font-semibold text-red-600'>
                                        -{order.discountPercent}%
                                    </Text>
                                </View>
                            )}
                            <View className='my-1 h-px bg-gray-300' />
                            <View className='flex-row justify-between'>
                                <Text className='text-lg font-bold text-gray-900'>Tổng thanh toán:</Text>
                                <Text className='text-xl font-bold text-green-600'>{formatPrice(order.total)}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </DialogContent>
        </Dialog>
    )
}
