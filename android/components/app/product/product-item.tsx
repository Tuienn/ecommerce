import { useState } from 'react'
import { View, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Star, ChevronDown, ChevronUp } from 'lucide-react-native'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { IProduct } from '@/types/product'
import { formatPrice, formatSoldCount } from '@/lib/format'

interface ProductInfoProps {
    product: IProduct
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)

    const getUnitLabel = (unit: string) => {
        const unitMap: Record<string, string> = {
            kg: 'Kg',
            gram: 'Gram',
            gói: 'Gói',
            chai: 'Chai',
            hộp: 'Hộp',
            thùng: 'Thùng',
            cái: 'Cái',
            bó: 'Bó',
            túi: 'Túi'
        }
        return unitMap[unit] || unit
    }

    return (
        <View className='gap-4 p-4'>
            {/* Product Name */}
            <View>
                <Text className='text-2xl font-bold text-gray-900'>{product.name}</Text>
            </View>

            {/* Badges */}
            <View className='flex-row gap-2'>
                {product.isFeatured && (
                    <Badge className='flex-row items-center gap-1 bg-yellow-500'>
                        <Star size={12} color='white' fill='white' />
                        <Text className='text-xs font-semibold text-white'>Nổi bật</Text>
                    </Badge>
                )}
                {product.discountPercent > 0 && (
                    <Badge className='bg-red-500'>
                        <Text className='text-xs font-semibold text-white'>-{product.discountPercent}%</Text>
                    </Badge>
                )}
                {product.stock > 0 ? (
                    <Badge className='bg-green-600'>
                        <Text className='text-xs font-semibold text-white'>Còn hàng ({product.stock})</Text>
                    </Badge>
                ) : (
                    <Badge className='bg-gray-400'>
                        <Text className='text-xs font-semibold text-white'>Hết hàng</Text>
                    </Badge>
                )}
            </View>

            {/* Price Section */}
            <View className='gap-2'>
                <View className='flex-row items-center gap-3'>
                    <Text className='text-3xl font-bold text-green-600'>{formatPrice(product.price)}</Text>
                    {product.discountPercent > 0 && (
                        <Text className='text-lg text-gray-400 line-through'>{formatPrice(product.basePrice)}</Text>
                    )}
                </View>
                <View className='flex-row items-center gap-2'>
                    <Text className='text-sm text-gray-500'>Đơn vị:</Text>
                    <Text className='text-sm font-medium text-gray-700'>{getUnitLabel(product.unit)}</Text>
                </View>
            </View>

            {/* Sold Count */}
            <View className='flex-row items-center gap-2 rounded-lg bg-background p-3'>
                <Text className='text-sm text-gray-600'>Đã bán:</Text>
                <Text className='text-sm font-semibold text-green-600'>
                    {formatSoldCount(product.soldCount)} {product.unit}
                </Text>
            </View>

            {/* Description with Collapsible */}
            {product.description && (
                <View className='gap-2'>
                    <Text className='text-lg font-semibold text-gray-900'>Mô tả sản phẩm</Text>
                    <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                        <CollapsibleContent>
                            <Text className='text-sm leading-6 text-gray-600'>{product.description}</Text>
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                            <Pressable className='mt-2 flex-row items-center gap-1'>
                                <Text className='text-sm font-medium text-green-600'>
                                    {isDescriptionOpen ? 'Thu gọn' : 'Xem thêm'}
                                </Text>
                                {isDescriptionOpen ? (
                                    <ChevronUp size={16} color='#16a34a' />
                                ) : (
                                    <ChevronDown size={16} color='#16a34a' />
                                )}
                            </Pressable>
                        </CollapsibleTrigger>
                    </Collapsible>
                </View>
            )}
        </View>
    )
}
