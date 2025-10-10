import { useState, useEffect } from 'react'
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SearchInput from '@/components/app/common/search-input'
import CartItem from '@/components/app/main/cart/cart-item'
import CartItemSkeleton from '@/components/app/main/cart/item-skeleton'
import PaymentDialog from '@/components/app/common/payment-dialog'
import CartService from '@/services/cart.service'
import { CheckoutData, ICartItem } from '@/types/cart'
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
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
    const [checkingOut, setCheckingOut] = useState(false)
    const router = useRouter()

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

    const calculateSelectedTotal = () => {
        return cartItems
            .filter((item) => selectedItems.has(item.productId._id))
            .reduce((total, item) => total + item.productId.price * item.quantity, 0)
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
            setPaymentDialogOpen(true)
        } catch (error) {
            console.error('Error checkout:', error)
            showNotification('error', 'Không thể thanh toán')
        } finally {
            setCheckingOut(false)
        }
    }

    const handlePaymentSuccess = async () => {
        showNotification('success', 'Đặt hàng thành công')
        setSelectedItems(new Set())
        setSelectAll(false)
        // Refresh cart
        await fetchCart(true, searchTerm)
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

            {/* Payment Dialog */}
            <PaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                checkoutData={checkoutData}
                onSuccess={handlePaymentSuccess}
            />
        </View>
    )
}

export default CartScreen
