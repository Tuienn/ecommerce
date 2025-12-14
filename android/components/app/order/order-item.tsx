import { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { IOrder, OrderStatus } from '@/types/order'
import { formatPrice } from '@/lib/format'
import { ChevronRight, XCircle } from 'lucide-react-native'
import OrderService from '@/services/order.service'
import { showNotification } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface OrderItemProps {
    order: IOrder
    onPress: (order: IOrder) => void
    onOrderCancelled?: () => void
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

const CANCEL_REASONS = [
    'Tôi muốn cập nhật địa chỉ/sđt nhận hàng',
    'Thay đổi đơn hàng (Loại sản phẩm, số lượng,...)',
    'Không thắc mắc về nguyên nhân',
    'Lý do khác'
]

export default function OrderItem({ order, onPress, onOrderCancelled }: OrderItemProps) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [selectedReason, setSelectedReason] = useState('')
    const [otherReason, setOtherReason] = useState('')
    const [cancelling, setCancelling] = useState(false)

    const statusInfo = getStatusInfo(order.status)
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const canCancel = ['PROCESSING', 'PAID'].includes(order.status)

    const handleCancelOrder = async () => {
        // Validate reason
        if (!selectedReason) {
            showNotification('error', 'Vui lòng chọn lý do hủy đơn')
            return
        }

        if (selectedReason === 'Lý do khác' && !otherReason.trim()) {
            showNotification('error', 'Vui lòng nhập lý do hủy đơn')
            return
        }

        const finalReason = selectedReason === 'Lý do khác' ? otherReason.trim() : selectedReason

        try {
            setCancelling(true)
            await OrderService.cancelOrder(order._id, finalReason)
            showNotification('success', 'Đã hủy đơn hàng thành công')
            setCancelDialogOpen(false)
            setSelectedReason('')
            setOtherReason('')
            if (onOrderCancelled) {
                onOrderCancelled()
            }
        } catch (error) {
            console.error('Error cancelling order:', error)
            showNotification('error', 'Không thể hủy đơn hàng')
        } finally {
            setCancelling(false)
        }
    }

    return (
        <View className='mx-4 mb-3 rounded-lg border border-gray-200 bg-white p-4'>
            <TouchableOpacity onPress={() => onPress(order)} activeOpacity={0.7}>
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

            {/* Cancel Reason Display */}
            {order.status === 'CANCELLED' && order.cancelReason && (
                <View className='mt-3 rounded-md bg-red-50 p-3'>
                    <Text className='text-xs font-medium text-red-800'>Lý do hủy:</Text>
                    <Text className='mt-1 text-sm text-red-700'>{order.cancelReason}</Text>
                </View>
            )}

            {/* Cancel Button */}
            {canCancel && (
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant='outline'
                            className='mt-2 flex-row items-center justify-center gap-2 border-red-500'
                            onPress={() => setCancelDialogOpen(true)}
                        >
                            <XCircle size={16} color='#ef4444' />
                            <Text className='text-red-500'>Hủy đơn hàng</Text>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='w-[90vw]'>
                        <DialogHeader>
                            <DialogTitle>Hủy đơn hàng</DialogTitle>
                            <DialogDescription>Vui lòng cho biết lý do bạn muốn hủy đơn hàng này</DialogDescription>
                        </DialogHeader>
                        <View className='gap-3'>
                            <Text className='text-sm font-medium text-gray-700'>Lý do hủy đơn</Text>
                            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                                {CANCEL_REASONS.map((reason) => (
                                    <View key={reason} className='flex-row items-center gap-3'>
                                        <RadioGroupItem value={reason} />
                                        <Label
                                            onPress={() => setSelectedReason(reason)}
                                            className='flex-1 text-sm text-gray-900'
                                        >
                                            {reason}
                                        </Label>
                                    </View>
                                ))}
                            </RadioGroup>

                            {selectedReason === 'Lý do khác' && (
                                <View className='gap-2'>
                                    <Textarea
                                        value={otherReason}
                                        onChangeText={setOtherReason}
                                        placeholder='Nhập lý do hủy đơn...'
                                        maxLength={200}
                                    />
                                    <Text className='text-xs text-gray-500'>{otherReason.length}/200 ký tự</Text>
                                </View>
                            )}
                        </View>
                        <DialogFooter className='flex-row gap-3'>
                            <DialogClose asChild>
                                <Button variant='outline' className='flex-1' disabled={cancelling}>
                                    <Text>Đóng</Text>
                                </Button>
                            </DialogClose>
                            <Button
                                onPress={handleCancelOrder}
                                variant='destructive'
                                className='flex-1'
                                disabled={
                                    cancelling ||
                                    !selectedReason ||
                                    (selectedReason === 'Lý do khác' && !otherReason.trim())
                                }
                            >
                                <Text className='text-white'>{cancelling ? 'Đang hủy...' : 'Xác nhận'}</Text>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </View>
    )
}
