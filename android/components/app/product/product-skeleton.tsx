import { Skeleton } from '@/components/ui/skeleton'
import { View } from 'react-native'

export default function ProductDetailSkeleton() {
    return (
        <View className='flex-1 bg-white'>
            {/* Image Skeleton */}
            <Skeleton className='h-80 w-full' />

            {/* Content Skeleton */}
            <View className='gap-4 p-4'>
                {/* Title */}
                <Skeleton className='h-8 w-[90%] rounded-md' />

                {/* Badges */}
                <View className='flex-row gap-2'>
                    <Skeleton className='h-6 w-20 rounded-full' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                    <Skeleton className='h-6 w-20 rounded-full' />
                </View>

                {/* Price */}
                <View className='gap-2'>
                    <Skeleton className='h-10 w-40 rounded-md' />
                    <Skeleton className='h-5 w-24 rounded-md' />
                </View>

                {/* Sold Count */}
                <Skeleton className='h-12 w-full rounded-lg' />

                {/* Description */}
                <View className='gap-2'>
                    <Skeleton className='h-6 w-32 rounded-md' />
                    <Skeleton className='h-20 w-full rounded-md' />
                </View>
            </View>
        </View>
    )
}
