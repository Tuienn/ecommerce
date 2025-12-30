import { memo } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'

interface SendMessageProps {
    text: string
    time: string
}

const SendMessage = memo(({ text, time }: SendMessageProps) => {
    return (
        <View className='mb-2 flex-row justify-end'>
            <View className='max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2'>
                <Text className='text-primary-foreground'>{text}</Text>
                <Text className='mt-1 text-right text-xs text-primary-foreground/70'>{time}</Text>
            </View>
        </View>
    )
})

SendMessage.displayName = 'SendMessage'

export default SendMessage
