import { useState, useEffect } from 'react'
import { View, FlatList, RefreshControl, ActivityIndicator, ScrollView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OrderItem from '@/components/app/order/order-item'
import OrderSkeleton from '@/components/app/order/order-skeleton'
import OrderDetailDialog from '@/components/app/order/order-detail-dialog'
import OrderService from '@/services/order.service'
import { IOrder, OrderStatus } from '@/types/order'
import { showNotification } from '@/lib/utils'

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
    { value: 'PROCESSING', label: 'Xử lý' },
    { value: 'PAID', label: 'Đã TT' },
    { value: 'SHIPPING', label: 'Giao hàng' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'FAILED', label: 'Thất bại' }
]

export default function OrderScreen() {
    const [activeTab, setActiveTab] = useState<OrderStatus>('PROCESSING')
    const [orders, setOrders] = useState<Record<string, IOrder[]>>({})
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [refreshing, setRefreshing] = useState<Record<string, boolean>>({})
    const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({})
    const [hasMore, setHasMore] = useState<Record<string, boolean>>({})
    const [currentPage, setCurrentPage] = useState<Record<string, number>>({})
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    useEffect(() => {
        fetchOrders(activeTab, true)
    }, [activeTab])

    const fetchOrders = async (status: string, isInitial: boolean = false) => {
        // Skip if already loading or no more data
        if (!isInitial && (loadingMore[status] || !hasMore[status])) {
            return
        }

        try {
            if (isInitial) {
                setLoading((prev) => ({ ...prev, [status]: true }))
                setCurrentPage((prev) => ({ ...prev, [status]: 1 }))
                setHasMore((prev) => ({ ...prev, [status]: true }))
            } else {
                setLoadingMore((prev) => ({ ...prev, [status]: true }))
            }

            const page = isInitial ? 1 : (currentPage[status] || 1) + 1
            const statusParam = status === 'ALL' ? undefined : status
            const response = await OrderService.getOrders(statusParam, page, 10)

            const newOrders = response.data.data || []

            if (isInitial) {
                setOrders((prev) => ({ ...prev, [status]: newOrders }))
            } else {
                setOrders((prev) => ({
                    ...prev,
                    [status]: [...(prev[status] || []), ...newOrders]
                }))
            }

            // Update pagination state
            if (response.data.data.pagination) {
                const { page: currentPageNum, totalPages } = response.data.data.pagination
                setCurrentPage((prev) => ({ ...prev, [status]: currentPageNum }))
                setHasMore((prev) => ({ ...prev, [status]: currentPageNum < totalPages }))
            } else {
                setHasMore((prev) => ({ ...prev, [status]: false }))
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            showNotification('error', 'Không thể tải đơn hàng')
        } finally {
            if (isInitial) {
                setLoading((prev) => ({ ...prev, [status]: false }))
            } else {
                setLoadingMore((prev) => ({ ...prev, [status]: false }))
            }
        }
    }

    const handleRefresh = async (status: string) => {
        setRefreshing((prev) => ({ ...prev, [status]: true }))
        await fetchOrders(status, true)
        setRefreshing((prev) => ({ ...prev, [status]: false }))
    }

    const handleLoadMore = (status: string) => {
        if (!loadingMore[status] && hasMore[status]) {
            fetchOrders(status, false)
        }
    }

    const handleOrderPress = (order: IOrder) => {
        setSelectedOrder(order)
        setDetailDialogOpen(true)
    }

    const renderOrderList = (status: string) => {
        const orderList = orders[status] || []
        const isLoading = loading[status]
        const isRefreshing = refreshing[status]
        const isLoadingMore = loadingMore[status]

        const renderFooter = () => {
            if (!isLoadingMore) return null
            return (
                <View className='py-4'>
                    <ActivityIndicator size='small' color='#16a34a' />
                </View>
            )
        }

        const renderEmpty = () => {
            if (isLoading) {
                return (
                    <View>
                        {[1, 2, 3, 4, 5].map((key) => (
                            <OrderSkeleton key={key} />
                        ))}
                    </View>
                )
            }

            return (
                <View className='flex-1 items-center justify-center py-20'>
                    <Text className='text-center text-gray-500'>Không có đơn hàng nào</Text>
                </View>
            )
        }

        return (
            <FlatList
                data={orderList}
                renderItem={({ item }) => <OrderItem order={item} onPress={handleOrderPress} />}
                keyExtractor={(item) => item._id}
                onEndReached={() => handleLoadMore(status)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => handleRefresh(status)}
                        colors={['#16a34a']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
            />
        )
    }

    return (
        <View className='flex-1 bg-gray-50'>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)} className='flex-1'>
                <View className='bg-white px-4 py-2'>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TabsList>
                            {ORDER_STATUSES.map((status) => (
                                <TabsTrigger key={status.value} value={status.value}>
                                    <Text>{status.label}</Text>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollView>
                </View>

                {ORDER_STATUSES.map((status) => (
                    <TabsContent key={status.value} value={status.value} className='flex-1'>
                        {renderOrderList(status.value)}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Order Detail Dialog */}
            <OrderDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} order={selectedOrder} />
        </View>
    )
}
