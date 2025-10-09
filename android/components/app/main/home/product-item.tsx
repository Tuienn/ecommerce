import { View, Image, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import { Star } from 'lucide-react-native'
import { IProduct } from '@/types/product'

interface ProductItemProps {
    product: IProduct
    onPress?: (product: IProduct) => void
}

const ProductItem = ({ product, onPress }: ProductItemProps) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price)
    }

    const formatSoldCount = (count: number) => {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`
        }
        return count.toString()
    }

    const handlePress = () => {
        onPress?.(product)
    }

    return (
        <Pressable onPress={handlePress} className='m-1 flex-1 rounded-lg border border-gray-100 bg-white shadow-sm'>
            <View className='relative'>
                {/* Product Image */}
                <View className='aspect-square overflow-hidden rounded-t-lg bg-gray-100'>
                    {product.images && product.images.length > 0 ? (
                        <Image source={{ uri: product.images[0] }} className='h-full w-full' resizeMode='cover' />
                    ) : (
                        <View className='h-full w-full items-center justify-center bg-gray-200'>
                            <Text className='text-xs text-gray-400'>Không có ảnh</Text>
                        </View>
                    )}
                </View>

                {/* Featured Badge - Top Left */}
                {product.isFeatured && (
                    <View className='absolute left-2 top-2 rounded-full bg-yellow-500 p-1'>
                        <Star size={12} color='white' fill='white' />
                    </View>
                )}

                {/* Discount Badge - Top Right */}
                {product.discountPercent > 0 && (
                    <View className='absolute right-2 top-2 rounded bg-red-500 px-2 py-1'>
                        <Text className='text-xs font-bold text-white'>-{product.discountPercent}%</Text>
                    </View>
                )}
            </View>

            {/* Product Info */}
            <View className='gap-2 p-3'>
                {/* Product Name */}
                <Text className='text-sm font-medium leading-4 text-gray-900' numberOfLines={2}>
                    {product.name}
                </Text>

                {/* Prices */}
                <View className='flex-row items-center gap-3'>
                    <Text className='text-base font-bold text-green-600'>{formatPrice(product.price)}</Text>
                    {product.discountPercent > 0 && (
                        <Text className='text-xs text-gray-400 line-through'>{formatPrice(product.basePrice)}</Text>
                    )}
                </View>

                {/* Sold Count */}
                <View className='flex-row items-center gap-1'>
                    <Text className='text-xs text-gray-400'>Đã bán</Text>
                    <Text className='text-xs text-primary'>{formatSoldCount(product.soldCount)}</Text>
                    <Text className='text-xs text-gray-400'>{product.unit}</Text>
                </View>
            </View>
        </Pressable>
    )
}

export default ProductItem
