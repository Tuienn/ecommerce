import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'

export default function AddressSkeleton() {
    return (
        <View className='mx-4 mb-3 rounded-lg border border-gray-200 bg-white p-4'>
            {/* Header */}
            <View className='mb-3 flex-row items-start justify-between'>
                <View className='flex-1'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='mt-2 h-4 w-28' />
                </View>
            </View>

            {/* Address */}
            <View className='mb-3'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='mt-1 h-4 w-3/4' />
            </View>

            {/* Actions */}
            <View className='flex-row gap-2 border-t border-gray-100 pt-3'>
                <Skeleton className='h-9 flex-1' />
                <Skeleton className='h-9 flex-1' />
                <Skeleton className='h-9 flex-1' />
            </View>
        </View>
    )
}
