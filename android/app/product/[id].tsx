import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import ImgCarousel from '@/components/app/product/img-carousel'
import ProductInfo from '@/components/app/product/product-item'
import ProductDetailSkeleton from '@/components/app/product/product-skeleton'
import ProductService from '@/services/product.service'
import { IProduct } from '@/types/product'
import { showNotification } from '@/lib/utils'

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const [product, setProduct] = useState<IProduct | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchProductDetail()
        }
    }, [id])

    const fetchProductDetail = async () => {
        try {
            setLoading(true)
            const response = await ProductService.getProductById(id as string)
            setProduct(response.data)
        } catch (error) {
            console.error('Error fetching product:', error)
            showNotification('error', 'Không thể tải thông tin sản phẩm')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        router.back()
    }

    const handleAddToCart = () => {
        if (!product) return
        // TODO: Implement add to cart logic
        console.log('Add to cart:', product._id)
        showNotification('success', `Đã thêm ${product.name} vào giỏ hàng`)
    }

    const handleBuyNow = () => {
        if (!product) return
        // TODO: Implement buy now logic
        console.log('Buy now:', product._id)
        showNotification('info', 'Tính năng mua ngay đang được phát triển')
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {/* Header with Back Button */}
            <View className='flex-row items-center border-b border-gray-200 px-4 py-3'>
                <TouchableOpacity onPress={handleBack} className='mr-3'>
                    <ArrowLeft color='#000' size={24} />
                </TouchableOpacity>
                <Text className='text-lg font-semibold'>Chi tiết sản phẩm</Text>
            </View>

            {/* Content */}
            {loading ? (
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    <ProductDetailSkeleton />
                </ScrollView>
            ) : product ? (
                <View className='flex-1'>
                    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                        {/* Product Images Carousel */}
                        <ImgCarousel images={product.images} />

                        {/* Product Info */}
                        <ProductInfo product={product} />
                    </ScrollView>

                    {/* Bottom Action Buttons */}
                    <View className='flex-row gap-3 border-t border-gray-200 bg-white px-4 py-3'>
                        <Button
                            onPress={handleAddToCart}
                            variant='outline'
                            className='flex-1 border-green-600'
                            disabled={product.stock === 0}
                        >
                            <Text className='font-semibold text-green-600'>Thêm vào giỏ</Text>
                        </Button>
                        <Button onPress={handleBuyNow} className='flex-1 bg-green-600' disabled={product.stock === 0}>
                            <Text className='font-semibold text-white'>Mua ngay</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-gray-500'>Không tìm thấy sản phẩm</Text>
                </View>
            )}
        </SafeAreaView>
    )
}
