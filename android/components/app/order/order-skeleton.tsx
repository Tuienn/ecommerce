import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrderSkeleton() {
    return (
        <View className='mx-4 mb-3 rounded-lg border border-gray-200 bg-white p-4'>
            {/* Header */}
            <View className='mb-3 flex-row items-center justify-between border-b border-gray-100 pb-3'>
                <View className='flex-1'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='mt-2 h-4 w-32' />
                </View>
                <Skeleton className='h-6 w-24 rounded-full' />
            </View>

            {/* Items */}
            <View className='mb-3 gap-2'>
                <View className='flex-row items-center justify-between'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-4 w-20' />
                </View>
                <View className='flex-row items-center justify-between'>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-4 w-20' />
                </View>
            </View>

            {/* Footer */}
            <View className='flex-row items-center justify-between border-t border-gray-100 pt-3'>
                <View className='flex-1'>
                    <Skeleton className='h-3 w-32' />
                    <Skeleton className='mt-2 h-5 w-24' />
                </View>
                <Skeleton className='h-5 w-5 rounded-full' />
            </View>
        </View>
    )
}
