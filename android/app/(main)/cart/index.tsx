import { useState, useEffect, useRef } from 'react'
import { View, FlatList, RefreshControl, ActivityIndicator, ScrollView, Platform } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import SearchInput from '@/components/app/common/search-input'
import CartItem from '@/components/app/main/cart/cart-item'
import CartItemSkeleton from '@/components/app/main/cart/item-skeleton'
import CartService from '@/services/cart.service'
import OrderService from '@/services/order.service'
import UserService from '@/services/user.service'
import { CheckoutData, ICartItem } from '@/types/cart'
import { IAddress } from '@/types/user'
import { showNotification } from '@/lib/utils'
import { formatPrice } from '@/lib/format'
import { useRouter } from 'expo-router'

const CartScreen = () => {
    const [cartItems, setCartItems] = useState<ICartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
    const [checkingOut, setCheckingOut] = useState(false)
    const [dialogStep, setDialogStep] = useState<'summary' | 'payment'>('summary')
    const [addresses, setAddresses] = useState<IAddress[]>([])
    const [selectedAddress, setSelectedAddress] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY'>('MOMO')
    const [creatingOrder, setCreatingOrder] = useState(false)
    const router = useRouter()
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
        fetchCart(true, '')
    }, [])

    const fetchCart = async (isInitial: boolean = false, search: string = searchTerm) => {
        if (isInitial) {
            setLoading(true)
            setCurrentPage(1)
            setHasMore(true)
        } else if (loadingMore || !hasMore) {
            return
        }

        try {
            if (!isInitial) {
                setLoadingMore(true)
            }

            const page = isInitial ? 1 : currentPage + 1
            const response = await CartService.getCarts(page, 10, search)

            const newItems = response.data.items || []

            if (isInitial) {
                setCartItems(newItems)
            } else {
                setCartItems((prev) => [...prev, ...newItems])
            }

            // Update pagination state
            if (response.data.pagination) {
                const { page: currentPageNum, totalPages } = response.data.pagination
                setCurrentPage(currentPageNum)
                setHasMore(currentPageNum < totalPages)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            showNotification('error', 'Không thể tải giỏ hàng')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleSearch = (term: string) => {
        setSearchTerm(term)
        setCurrentPage(1)
        setHasMore(true)
        fetchCart(true, term)
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchCart(true, searchTerm)
        setRefreshing(false)
    }

    const handleLoadMore = () => {
        if (hasMore && !loadingMore && !loading) {
            fetchCart(false, searchTerm)
        }
    }

    const handleItemPress = (item: ICartItem) => {
        router.push(`/product/${item.productId._id}`)
    }

    const handleCheckChange = (item: ICartItem, checked: boolean) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev)
            if (checked) {
                newSet.add(item.productId._id)
            } else {
                newSet.delete(item.productId._id)
            }
            // Update selectAll state
            setSelectAll(newSet.size === cartItems.length && cartItems.length > 0)
            return newSet
        })
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked)
        if (checked) {
            setSelectedItems(new Set(cartItems.map((item) => item.productId._id)))
        } else {
            setSelectedItems(new Set())
        }
    }

    const SHIPPING_FEE = 20000

    const calculateSelectedTotal = () => {
        return cartItems
            .filter((item) => selectedItems.has(item.productId._id))
            .reduce((total, item) => total + item.productId.price * item.quantity, 0)
    }

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

    const handleCheckout = async () => {
        if (selectedItems.size === 0) {
            showNotification('error', 'Vui lòng chọn ít nhất một sản phẩm')
            return
        }

        try {
            setCheckingOut(true)
            const productIds = Array.from(selectedItems)
            const response = await CartService.checkout(productIds)
            setCheckoutData(response.data)
            setDialogStep('summary')
            setCheckoutDialogOpen(true)
            // Fetch addresses for next step
            await fetchAddresses()
        } catch (error) {
            console.error('Error checkout:', error)
            showNotification('error', 'Không thể thanh toán')
        } finally {
            setCheckingOut(false)
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
            setCheckoutDialogOpen(false)
            setDialogStep('summary')
            setSelectedItems(new Set())
            setSelectAll(false)
            // Refresh cart
            await fetchCart(true, searchTerm)
        } catch (error) {
            console.error('Error creating order:', error)
            showNotification('error', 'Không thể tạo đơn hàng')
        } finally {
            setCreatingOrder(false)
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedItems.size === 0) return

        try {
            const productIds = Array.from(selectedItems)
            await Promise.all(productIds.map((id) => CartService.removeCartItem(id)))
            showNotification('success', `Đã xóa ${selectedItems.size} sản phẩm`)
            setSelectedItems(new Set())
            setSelectAll(false)
            await fetchCart(true, searchTerm)
        } catch (error) {
            console.error('Error deleting items:', error)
            showNotification('error', 'Không thể xóa sản phẩm')
        }
    }

    const handleClearCart = async () => {
        try {
            await CartService.clearCart()
            showNotification('success', 'Đã xóa tất cả sản phẩm')
            setSelectedItems(new Set())
            setSelectAll(false)
            await fetchCart(true, searchTerm)
        } catch (error) {
            console.error('Error clearing cart:', error)
            showNotification('error', 'Không thể xóa giỏ hàng')
        }
    }

    const renderItem = ({ item }: { item: ICartItem }) => (
        <CartItem
            item={item}
            selected={selectedItems.has(item.productId._id)}
            onPress={handleItemPress}
            onCheckChange={handleCheckChange}
        />
    )

    const renderFooter = () => {
        if (!loadingMore) return null
        return (
            <View className='py-4'>
                <ActivityIndicator size='small' color='#16a34a' />
            </View>
        )
    }

    const renderEmpty = () => {
        if (loading) {
            return (
                <View>
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                </View>
            )
        }

        return (
            <View className='flex-1 items-center justify-center py-20'>
                <Text className='text-lg text-gray-400'>
                    {searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Giỏ hàng trống'}
                </Text>
                <Text className='mt-2 text-sm text-gray-400'>
                    {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm sản phẩm vào giỏ hàng'}
                </Text>
            </View>
        )
    }

    return (
        <View className='flex-1 bg-gray-50'>
            {/* Search Header */}
            <View className='border-b border-gray-100 bg-white px-4 py-3'>
                <View className='flex-row items-center gap-2'>
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    <SearchInput onSearch={handleSearch} initialValue={searchTerm} />
                </View>
            </View>

            {/* Cart Items List */}
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.productId._id}-${index}`}
                contentContainerStyle={{
                    paddingTop: 12,
                    paddingBottom: 140
                }}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#16a34a']} />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Checkout Footer */}
            {cartItems.length > 0 && (
                <View className='absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4'>
                    {selectedItems.size > 0 ? (
                        <View className='gap-3'>
                            <View className='flex-row gap-2'>
                                <Button variant='outline' onPress={handleDeleteSelected} className='border-red-500'>
                                    <Text className='text-red-500'>Xóa đã chọn</Text>
                                </Button>
                                <Button variant='destructive' className='flex-1' onPress={handleClearCart}>
                                    <Text>Xóa tất cả</Text>
                                </Button>
                            </View>
                            {/* Selected Info */}
                            <View className='flex-row items-center justify-between'>
                                <View>
                                    <Text className='text-sm text-gray-600'>
                                        Đã chọn: {selectedItems.size} / {cartItems.length} sản phẩm
                                    </Text>
                                    <Text className='text-xl font-bold text-green-600'>
                                        {formatPrice(calculateSelectedTotal())}
                                    </Text>
                                </View>
                                <Button onPress={handleCheckout} disabled={checkingOut}>
                                    <Text className='font-semibold text-white'>
                                        {checkingOut ? 'Đang xử lý...' : 'Mua hàng'}
                                    </Text>
                                </Button>
                            </View>
                        </View>
                    ) : (
                        <View className='flex-row items-center justify-between'>
                            <View>
                                <Text className='text-sm text-gray-600'>Đã chọn: 0 / {cartItems.length} sản phẩm</Text>
                                <Text className='text-xl font-bold text-gray-400'>0₫</Text>
                            </View>
                            <Button onPress={handleCheckout} className='bg-gray-400 px-8' disabled>
                                <Text className='font-semibold text-white'>Mua hàng</Text>
                            </Button>
                        </View>
                    )}
                </View>
            )}

            {/* Checkout Dialog */}
            <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
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
                                            <View
                                                key={index}
                                                className='rounded-lg border border-gray-200 bg-gray-50 p-3'
                                            >
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
                                                <Text className='text-lg font-bold text-gray-900'>
                                                    Tổng thanh toán:
                                                </Text>
                                                <Text className='text-xl font-bold text-green-600'>
                                                    {formatPrice(checkoutData.totalAmount + SHIPPING_FEE)}
                                                </Text>
                                            </View>
                                            {checkoutData.baseTotalAmount > checkoutData.totalAmount && (
                                                <Text className='text-xs text-green-600'>
                                                    Tiết kiệm:{' '}
                                                    {formatPrice(
                                                        checkoutData.baseTotalAmount - checkoutData.totalAmount
                                                    )}
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
                                            onValueChange={(option) =>
                                                setPaymentMethod(option?.value as 'MOMO' | 'VNPAY')
                                            }
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
                                                <Text className='text-lg font-bold text-gray-900'>
                                                    Tổng thanh toán:
                                                </Text>
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
        </View>
    )
}

export default CartScreen
