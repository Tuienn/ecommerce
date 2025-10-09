import { useState } from 'react'
import { View, Image, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Text } from '@/components/ui/text'

interface ImgCarouselProps {
    images: string[]
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ImgCarousel({ images }: ImgCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x
        const index = Math.round(scrollPosition / SCREEN_WIDTH)
        setActiveIndex(index)
    }

    if (!images || images.length === 0) {
        return (
            <View className='h-80 items-center justify-center bg-gray-100'>
                <Text className='text-gray-400'>Không có hình ảnh</Text>
            </View>
        )
    }

    return (
        <View className='relative'>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {images.map((image, index) => (
                    <View key={index} style={{ width: SCREEN_WIDTH }} className='h-80'>
                        <Image source={{ uri: image }} className='h-full w-full' resizeMode='cover' />
                    </View>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            {images.length > 1 && (
                <View className='absolute bottom-4 left-0 right-0 flex-row justify-center gap-2'>
                    {images.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full ${index === activeIndex ? 'w-6 bg-green-600' : 'w-2 bg-gray-300'}`}
                        />
                    ))}
                </View>
            )}
        </View>
    )
}
