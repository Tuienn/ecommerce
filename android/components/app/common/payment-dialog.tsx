import { useState, useEffect, useRef } from 'react'
import { View, ScrollView, Platform } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TriggerRef } from '@rn-primitives/select'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import UserService from '@/services/user.service'
import OrderService from '@/services/order.service'
import { IAddress } from '@/types/user'
import { CheckoutData } from '@/types/cart'
import { showNotification } from '@/lib/utils'
import { formatPrice } from '@/lib/format'

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    checkoutData: CheckoutData | null
    onSuccess?: () => void
}

const SHIPPING_FEE = 20000

export default function PaymentDialog({ open, onOpenChange, checkoutData, onSuccess }: PaymentDialogProps) {
    const [dialogStep, setDialogStep] = useState<'summary' | 'payment'>('summary')
    const [addresses, setAddresses] = useState<IAddress[]>([])
    const [selectedAddress, setSelectedAddress] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY'>('MOMO')
    const [creatingOrder, setCreatingOrder] = useState(false)

    const insets = useSafeAreaInsets()
    const addressSelectRef = useRef<TriggerRef>(null)
    const paymentSelectRef = useRef<TriggerRef>(null)

    const contentInsets = {
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12
    }

    useEffect(() => {
        if (open) {
            fetchAddresses()
        }
    }, [open])

    const fetchAddresses = async () => {
        try {
            const response = await UserService.getAddresses()
            setAddresses(response.data || [])
            // Set default address if available
            const defaultAddr = response.data?.find((addr: IAddress) => addr.isDefault)
            if (defaultAddr) {
                setSelectedAddress(defaultAddr._id)
            } else if (response.data && response.data.length > 0) {
                setSelectedAddress(response.data[0]._id)
            }
        } catch (error) {
            console.error('Error fetching addresses:', error)
            showNotification('error', 'Không thể tải địa chỉ')
        }
    }

    const handleConfirmSummary = () => {
        setDialogStep('payment')
    }

    const handleCreateOrder = async () => {
        if (!selectedAddress) {
            showNotification('error', 'Vui lòng chọn địa chỉ giao hàng')
            return
        }

        if (!checkoutData) return

        try {
            setCreatingOrder(true)
            const items = checkoutData.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity
            }))

            const orderData = {
                items,
                shippingAddress: selectedAddress,
                payment: {
                    provider: paymentMethod,
                    amount: checkoutData.totalAmount + SHIPPING_FEE
                }
            }

            await OrderService.createOrder(orderData)
            showNotification('success', 'Đặt hàng thành công')
            onOpenChange(false)
            setDialogStep('summary')
            onSuccess?.()
        } catch (error) {
            console.error('Error creating order:', error)
            showNotification('error', 'Không thể tạo đơn hàng')
        } finally {
            setCreatingOrder(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        setDialogStep('summary')
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='w-[90vw]'>
                {dialogStep === 'summary' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                            <DialogDescription>Thông tin sản phẩm đã chọn</DialogDescription>
                        </DialogHeader>

                        {checkoutData && (
                            <ScrollView showsVerticalScrollIndicator={false} className='max-h-96'>
                                <View className='gap-3'>
                                    {/* Items List */}
                                    {checkoutData.items.map((item, index) => (
                                        <View key={index} className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                                            <Text className='font-medium text-gray-900'>{item.name}</Text>
                                            <View className='mt-2 flex-row items-center justify-between'>
                                                <Text className='text-sm text-gray-600'>
                                                    {formatPrice(item.price)} x {item.quantity} {item.unit}
                                                </Text>
                                                <Text className='font-semibold text-green-600'>
                                                    {formatPrice(item.total)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}

                                    {/* Total Summary */}
                                    <View className='mt-2 gap-2 rounded-lg border border-green-200 bg-green-50 p-3'>
                                        {checkoutData.baseTotalAmount > checkoutData.totalAmount && (
                                            <View className='flex-row justify-between'>
                                                <Text className='text-sm text-gray-600'>Tổng giá gốc:</Text>
                                                <Text className='text-sm text-gray-400 line-through'>
                                                    {formatPrice(checkoutData.baseTotalAmount)}
                                                </Text>
                                            </View>
                                        )}
                                        <View className='flex-row justify-between'>
                                            <Text className='text-sm text-gray-600'>Tổng sản phẩm:</Text>
                                            <Text className='text-sm font-semibold text-gray-900'>
                                                {formatPrice(checkoutData.totalAmount)}
                                            </Text>
                                        </View>
                                        <View className='flex-row justify-between'>
                                            <Text className='text-sm text-gray-600'>Phí vận chuyển:</Text>
                                            <Text className='text-sm font-semibold text-gray-900'>
                                                {formatPrice(SHIPPING_FEE)}
                                            </Text>
                                        </View>
                                        <View className='my-1 h-px bg-gray-300' />
                                        <View className='flex-row justify-between'>
                                            <Text className='text-lg font-bold text-gray-900'>Tổng thanh toán:</Text>
                                            <Text className='text-xl font-bold text-green-600'>
                                                {formatPrice(checkoutData.totalAmount + SHIPPING_FEE)}
                                            </Text>
                                        </View>
                                        {checkoutData.baseTotalAmount > checkoutData.totalAmount && (
                                            <Text className='text-xs text-green-600'>
                                                Tiết kiệm:{' '}
                                                {formatPrice(checkoutData.baseTotalAmount - checkoutData.totalAmount)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <DialogFooter className='flex-row gap-2'>
                            <DialogClose asChild>
                                <Button variant='outline' className='flex-1'>
                                    <Text>Đóng</Text>
                                </Button>
                            </DialogClose>
                            <Button className='flex-1 bg-green-600' onPress={handleConfirmSummary}>
                                <Text className='text-white'>Tiếp tục</Text>
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Thông tin thanh toán</DialogTitle>
                            <DialogDescription>Chọn địa chỉ và phương thức thanh toán</DialogDescription>
                        </DialogHeader>

                        <ScrollView showsVerticalScrollIndicator={false} className='max-h-96'>
                            <View className='gap-4'>
                                {/* Address Selection */}
                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Địa chỉ giao hàng</Label>
                                    <Select
                                        value={{ value: selectedAddress, label: '' }}
                                        onValueChange={(option) => setSelectedAddress(option?.value || '')}
                                    >
                                        <SelectTrigger ref={addressSelectRef} disabled={addresses.length === 0}>
                                            <SelectValue placeholder='Chọn địa chỉ' />
                                        </SelectTrigger>
                                        <SelectContent insets={contentInsets}>
                                            <SelectGroup>
                                                {addresses.map((address) => (
                                                    <SelectItem
                                                        key={address._id}
                                                        label={`${address.name} - ${address.addressLine}, ${address.ward}, ${address.city}`}
                                                        value={address._id}
                                                    >
                                                        {address.name} - {address.addressLine}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </View>

                                {/* Payment Method Selection */}
                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Phương thức thanh toán</Label>
                                    <Select
                                        value={{ value: paymentMethod, label: paymentMethod }}
                                        onValueChange={(option) => setPaymentMethod(option?.value as 'MOMO' | 'VNPAY')}
                                    >
                                        <SelectTrigger ref={paymentSelectRef}>
                                            <SelectValue placeholder='Chọn phương thức' />
                                        </SelectTrigger>
                                        <SelectContent insets={contentInsets}>
                                            <SelectGroup>
                                                <SelectItem label='MoMo' value='MOMO'>
                                                    MoMo
                                                </SelectItem>
                                                <SelectItem label='VNPay' value='VNPAY'>
                                                    VNPay
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </View>

                                {/* Total */}
                                {checkoutData && (
                                    <View className='gap-2 rounded-lg border border-green-200 bg-green-50 p-3'>
                                        <View className='flex-row justify-between'>
                                            <Text className='text-sm text-gray-600'>Tổng sản phẩm:</Text>
                                            <Text className='text-sm font-semibold text-gray-900'>
                                                {formatPrice(checkoutData.totalAmount)}
                                            </Text>
                                        </View>
                                        <View className='flex-row justify-between'>
                                            <Text className='text-sm text-gray-600'>Phí vận chuyển:</Text>
                                            <Text className='text-sm font-semibold text-gray-900'>
                                                {formatPrice(SHIPPING_FEE)}
                                            </Text>
                                        </View>
                                        <View className='my-1 h-px bg-gray-300' />
                                        <View className='flex-row justify-between'>
                                            <Text className='text-lg font-bold text-gray-900'>Tổng thanh toán:</Text>
                                            <Text className='text-xl font-bold text-green-600'>
                                                {formatPrice(checkoutData.totalAmount + SHIPPING_FEE)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <DialogFooter className='flex-row gap-2'>
                            <Button variant='outline' className='flex-1' onPress={() => setDialogStep('summary')}>
                                <Text>Quay lại</Text>
                            </Button>
                            <Button
                                className='flex-1 bg-green-600'
                                onPress={handleCreateOrder}
                                disabled={creatingOrder || !selectedAddress}
                            >
                                <Text className='text-white'>{creatingOrder ? 'Đang xử lý...' : 'Đặt hàng'}</Text>
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
