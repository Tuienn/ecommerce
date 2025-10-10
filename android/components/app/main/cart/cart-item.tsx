import { View, Image, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ICartItem } from '@/types/cart'
import { formatPrice } from '@/lib/format'

interface CartItemProps {
    item: ICartItem
    selected?: boolean
    onPress?: (item: ICartItem) => void
    onCheckChange?: (item: ICartItem, checked: boolean) => void
}

export default function CartItem({ item, selected = false, onPress, onCheckChange }: CartItemProps) {
    const { productId: product, quantity } = item

    const handlePress = () => {
        onPress?.(item)
    }

    const handleCheckChange = (checked: boolean) => {
        onCheckChange?.(item, checked)
    }

    const calculateTotal = () => {
        return product.price * quantity
    }

    return (
        <View className='mx-4 mb-3 flex-row gap-2 rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
            {/* Checkbox */}
            <View className='justify-center pt-1'>
                <Checkbox checked={selected} onCheckedChange={handleCheckChange} />
            </View>

            {/* Pressable Content */}
            <Pressable onPress={handlePress} className='flex-1 flex-row gap-3'>
                {/* Product Image */}
                <View className='relative'>
                    <View className='h-24 w-24 overflow-hidden rounded-lg bg-gray-100'>
                        {product.images && product.images.length > 0 ? (
                            <Image source={{ uri: product.images[0] }} className='h-full w-full' resizeMode='cover' />
                        ) : (
                            <View className='h-full w-full items-center justify-center bg-gray-200'>
                                <Text className='text-xs text-gray-400'>Không có ảnh</Text>
                            </View>
                        )}
                    </View>

                    {/* Discount Badge */}
                    {product.discountPercent > 0 && (
                        <View className='absolute right-0 top-0 rounded-bl rounded-tr-lg bg-red-500 px-1 py-0.5'>
                            <Text className='text-[10px] font-bold text-white'>-{product.discountPercent}%</Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View className='flex-1 justify-between'>
                    {/* Product Name */}
                    <Text className='text-base font-medium leading-5 text-gray-900' numberOfLines={2}>
                        {product.name}
                    </Text>

                    {/* Prices */}
                    <View className='gap-1'>
                        <View className='flex-row items-center gap-2'>
                            <Text className='text-lg font-bold text-green-600'>{formatPrice(product.price)}</Text>
                            {product.discountPercent > 0 && (
                                <Text className='text-xs text-gray-400 line-through'>
                                    {formatPrice(product.basePrice)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Quantity and Total */}
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center gap-1'>
                            <Text className='text-sm text-gray-600'>Số lượng:</Text>
                            <Badge className='bg-green-600'>
                                <Text className='text-xs font-semibold text-white'>
                                    {quantity} {product.unit}
                                </Text>
                            </Badge>
                        </View>
                        <Text className='text-base font-bold text-green-600'>{formatPrice(calculateTotal())}</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    )
}
