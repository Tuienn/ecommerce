import { View, ScrollView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IOrder } from '@/types/order'
import { formatPrice } from '@/lib/format'
import { getStatusInfo } from './order-item'

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='w-[90vw]'>
                <DialogHeader>
                    <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                    <DialogDescription>Mã đơn: #{order._id.slice(-8).toUpperCase()}</DialogDescription>
                </DialogHeader>

                <ScrollView showsVerticalScrollIndicator={false}>
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
