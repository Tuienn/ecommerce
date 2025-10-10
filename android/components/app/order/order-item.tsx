import { View, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { IOrder, OrderStatus } from '@/types/order'
import { formatPrice } from '@/lib/format'
import { ChevronRight } from 'lucide-react-native'

interface OrderItemProps {
    order: IOrder
    onPress: (order: IOrder) => void
}

export const getStatusInfo = (status: OrderStatus) => {
    const statusMap = {
        PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100' },
        PAID: { label: 'Đã thanh toán', color: 'bg-green-100' },
        FAILED: { label: 'Thất bại', color: 'bg-red-100' },
        CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100' },
        SHIPPING: { label: 'Đang giao', color: 'bg-purple-100' },
        COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 border-gray-500' }
}

export default function OrderItem({ order, onPress }: OrderItemProps) {
    const statusInfo = getStatusInfo(order.status)
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <TouchableOpacity
            onPress={() => onPress(order)}
            className='mx-4 mb-3 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50'
        >
            {/* Header */}
            <View className='mb-3 flex-row items-center justify-between border-b border-gray-100 pb-3'>
                <View className='flex-1'>
                    <Text className='text-xs text-gray-500'>Mã đơn hàng</Text>
                    <Text className='mt-1 font-medium text-gray-900'>#{order._id.slice(-8).toUpperCase()}</Text>
                </View>
                <Badge className={statusInfo.color}>
                    <Text className='text-black'>{statusInfo.label}</Text>
                </Badge>
            </View>

            {/* Items Summary */}
            <View className='mb-3 gap-2'>
                {order.items.slice(0, 2).map((item, index) => (
                    <View key={index} className='flex-row items-center justify-between'>
                        <Text className='flex-1 text-sm text-gray-700' numberOfLines={1}>
                            {item.name} x{item.quantity}
                        </Text>
                        <Text className='text-sm font-medium text-gray-900'>
                            {formatPrice(item.price * item.quantity)}
                        </Text>
                    </View>
                ))}
                {order.items.length > 2 && (
                    <Text className='text-xs text-gray-500'>Và {order.items.length - 2} sản phẩm khác...</Text>
                )}
            </View>

            {/* Footer */}
            <View className='flex-row items-center justify-between border-t border-gray-100 pt-3'>
                <View className='flex-1'>
                    <Text className='text-xs text-gray-500'>{orderDate}</Text>
                    <View className='mt-1 flex-row items-baseline gap-1'>
                        <Text className='text-xs text-gray-600'>Tổng:</Text>
                        <Text className='text-lg font-bold text-green-600'>{formatPrice(order.total)}</Text>
                    </View>
                </View>
                <ChevronRight size={20} color='#9ca3af' />
            </View>
        </TouchableOpacity>
    )
}
