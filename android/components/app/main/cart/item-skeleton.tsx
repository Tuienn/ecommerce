import { Skeleton } from '@/components/ui/skeleton'
import { View } from 'react-native'

export default function CartItemSkeleton() {
    return (
        <View className='mx-4 mb-3 flex-row gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
            {/* Image Skeleton */}
            <Skeleton className='h-24 w-24 rounded-lg' />

            {/* Content Skeleton */}
            <View className='flex-1 justify-between'>
                {/* Name */}
                <Skeleton className='h-5 w-[90%] rounded-md' />

                {/* Price */}
                <Skeleton className='h-6 w-28 rounded-md' />

                {/* Quantity */}
                <Skeleton className='h-8 w-24 rounded-md' />
            </View>
        </View>
    )
}
