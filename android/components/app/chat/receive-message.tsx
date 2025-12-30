import { memo } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'

interface ReceiveMessageProps {
    text: string
    sender: string
    time: string
}

const ReceiveMessage = memo(({ text, sender, time }: ReceiveMessageProps) => {
    return (
        <View className='mb-2 flex-row justify-start'>
            <View className='max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2'>
                <Text className='text-xs font-medium text-muted-foreground'>{sender}</Text>
                <Text className='mt-1'>{text}</Text>
                <Text className='mt-1 text-xs text-muted-foreground'>{time}</Text>
            </View>
        </View>
    )
})

ReceiveMessage.displayName = 'ReceiveMessage'

export default ReceiveMessage
