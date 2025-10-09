import { Skeleton } from '@/components/ui/skeleton'
import { View } from 'react-native'

export default function ProductSkeleton() {
    return (
        <View className='h-[200px] w-full p-2'>
            {/* Khung ngoài chia theo chiều dọc */}
            <View className='flex-1 justify-between'>
                {/* Ảnh chiếm 60% chiều cao */}
                <Skeleton className='h-[70%] w-full rounded-xl' />

                {/* Hai dòng chữ chiếm 20% còn lại */}
                <View className='gap-2'>
                    <Skeleton className='h-4 w-[80%] rounded-md' />
                    <Skeleton className='h-4 w-[60%] rounded-md' />
                </View>
            </View>
        </View>
    )
}
