import { useState, useEffect } from 'react'
import { View, FlatList, RefreshControl } from 'react-native'
import { Text } from '@/components/ui/text'
import SearchInput from '../../../components/app/main/home/search-input'
import CategoryFilter from '../../../components/app/main/home/category-filter'
import ProductItem from '../../../components/app/main/home/product-item'
import ProductSkeleton from '@/components/app/main/home/product-skeleton'
import ProductService from '@/services/product.service'
import { IProduct, ProductSearchParams, FilterState } from '@/types/product'

const HomeScreen = () => {
    const [products, setProducts] = useState<IProduct[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    // Filter state - applied filters
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        searchTerm: '',
        categoryIds: [],
        isFeatured: undefined,
        sortPrice: undefined,
        sortDiscount: undefined
    })

    useEffect(() => {
        fetchProducts(true)
    }, [])

    const buildSearchParams = (page: number = 1, filters: FilterState = appliedFilters): ProductSearchParams => {
        const params: ProductSearchParams = {
            page,
            limit: 10
        }

        if (filters.searchTerm.trim()) {
            params.name = filters.searchTerm.trim()
        }

        if (filters.categoryIds.length > 0) {
            params.categoryIds = filters.categoryIds
        }

        if (typeof filters.isFeatured === 'boolean') {
            params.isFeatured = filters.isFeatured
        }

        if (filters.sortPrice) {
            params.sortPrice = filters.sortPrice
        }

        if (filters.sortDiscount) {
            params.sortDiscount = filters.sortDiscount
        }

        return params
    }

    const fetchProducts = async (reset: boolean = false, filters?: FilterState) => {
        if (loading || loadingMore) return

        const page = reset ? 1 : currentPage + 1
        const filtersToUse = filters || appliedFilters

        try {
            if (reset) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            const params = buildSearchParams(page, filtersToUse)
            const response = await ProductService.simpleSearchProducts(
                params.name,
                params.categoryIds,
                params.isFeatured,
                params.sortDiscount,
                params.sortPrice,
                params.page,
                params.limit
            )

            if (response.code === 200) {
                const newProducts = response.data.data || []

                if (reset) {
                    setProducts(newProducts)
                    setCurrentPage(1)
                } else {
                    setProducts((prev) => [...prev, ...newProducts])
                    setCurrentPage(page)
                }

                // Check if there are more products to load
                const pagination = response.data.pagination
                setHasMore(pagination ? page < pagination.totalPages : false)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            setRefreshing(false)
        }
    }

    const handleSearch = (term: string) => {
        const newFilters = {
            ...appliedFilters,
            searchTerm: term
        }
        setAppliedFilters(newFilters)
        setCurrentPage(1)
        setHasMore(true)
        fetchProducts(true, newFilters)
    }

    const handleFiltersApply = (filters: FilterState) => {
        setAppliedFilters(filters)
        setCurrentPage(1)
        setHasMore(true)
        fetchProducts(true, filters)
    }

    const handleRefresh = () => {
        setRefreshing(true)
        setCurrentPage(1)
        setHasMore(true)
        fetchProducts(true, appliedFilters)
    }

    const handleLoadMore = () => {
        if (hasMore && !loadingMore && !loading) {
            fetchProducts(false, appliedFilters)
        }
    }

    const handleProductPress = (product: IProduct) => {
        // Navigate to product detail screen
        console.log('Product pressed:', product.name)
    }

    const renderProduct = ({ item }: { item: IProduct; index: number }) => (
        <ProductItem product={item} onPress={handleProductPress} />
    )

    const renderFooter = () => {
        if (!loadingMore) return null
        return (
            <View className='py-4'>
                <ProductSkeleton />
            </View>
        )
    }

    const renderEmpty = () => {
        if (loading) return null

        return (
            <View className='flex-1 items-center justify-center py-20'>
                <Text className='text-center text-gray-500'>
                    {appliedFilters.searchTerm ||
                    appliedFilters.categoryIds.length > 0 ||
                    appliedFilters.sortPrice ||
                    appliedFilters.sortDiscount ||
                    appliedFilters.isFeatured
                        ? 'Không tìm thấy sản phẩm nào'
                        : 'Chưa có sản phẩm nào'}
                </Text>
            </View>
        )
    }

    return (
        <View className='flex-1 bg-gray-50'>
            {/* Search and Filter Header */}
            <View className='border-b border-gray-100 bg-background px-4 py-3'>
                <View className='flex-row items-center gap-2'>
                    <SearchInput onSearch={handleSearch} initialValue={appliedFilters.searchTerm} />
                    <CategoryFilter appliedFilters={appliedFilters} onFiltersApply={handleFiltersApply} />
                </View>
            </View>

            {/* Products List */}
            {loading ? (
                <View className='flex-1 px-2 pt-4'>
                    <View className='flex-row flex-wrap'>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <View key={index} className='w-1/2'>
                                <ProductSkeleton />
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item, index) => `${item._id}-${index}`}
                    numColumns={2}
                    contentContainerStyle={{
                        paddingHorizontal: 8,
                        paddingTop: 8,
                        paddingBottom: 60
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
            )}
        </View>
    )
}

export default HomeScreen
