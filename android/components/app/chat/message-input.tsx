import { memo, useState, useCallback } from 'react'
import { View } from 'react-native'
import { Send } from 'lucide-react-native'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
    onSend: (text: string) => void
}

const MessageInput = memo(({ onSend }: MessageInputProps) => {
    const [value, setValue] = useState('')

    const handleSend = useCallback(() => {
        if (!value.trim()) return
        onSend(value.trim())
        setValue('')
    }, [value, onSend])

    return (
        <View className='flex-row items-center gap-2 border-t border-border bg-background px-4 py-3'>
            <Input
                className='flex-1'
                placeholder='Nhập tin nhắn...'
                value={value}
                onChangeText={setValue}
                onSubmitEditing={handleSend}
                returnKeyType='send'
            />
            <Button onPress={handleSend} disabled={!value.trim()} size={'icon'}>
                <Send size={20} color='white' />
            </Button>
        </View>
    )
})

MessageInput.displayName = 'MessageInput'

export default MessageInput
