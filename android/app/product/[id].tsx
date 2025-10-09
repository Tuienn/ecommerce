import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()

    const handleBack = () => {
        router.back()
    }

    const handleAddToCart = () => {
        // TODO: Implement add to cart logic
        console.log('Add to cart:', id)
    }

    const handleBuyNow = () => {
        // TODO: Implement buy now logic
        console.log('Buy now:', id)
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {/* Header with Back Button */}
            <View className='flex-row items-center border-b border-gray-200 px-4 py-3'>
                <TouchableOpacity onPress={handleBack} className='mr-3'>
                    <ArrowLeft color='#000' size={24} />
                </TouchableOpacity>
                <Text className='text-lg font-semibold'>Product Detail</Text>
            </View>

            {/* Content */}
            <View className='flex-1'>
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    {/* Product Image Placeholder */}
                    <View className='mx-4 mt-4 h-80 items-center justify-center rounded-lg bg-gray-100'>
                        <Text className='text-center text-gray-500'>
                            Demo Product Image{'\n'}ID: {id}
                        </Text>
                    </View>

                    {/* Product Info Demo */}
                    <View className='mx-4 mt-4'>
                        <Text className='text-2xl font-bold'>Product Name</Text>
                        <Text className='mt-2 text-xl font-semibold text-green-600'>$99.99</Text>
                        <Text className='mt-4 text-gray-600'>
                            This is a demo product description. Add your product details here.
                        </Text>
                    </View>
                </ScrollView>

                {/* Bottom Action Buttons */}
                <View className='flex-row gap-3 border-t border-gray-200 bg-white px-4 py-3'>
                    <Button onPress={handleAddToCart} variant='outline' className='flex-1 border-green-600'>
                        <Text className='font-semibold text-green-600'>Add to Cart</Text>
                    </Button>
                    <Button onPress={handleBuyNow} className='flex-1 bg-green-600'>
                        <Text className='font-semibold text-white'>Buy Now</Text>
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    )
}
