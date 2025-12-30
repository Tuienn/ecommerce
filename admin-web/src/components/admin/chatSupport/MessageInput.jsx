import { memo, useState, useCallback } from 'react'
import { Input, Button } from 'antd'
import { SendOutlined } from '@ant-design/icons'

const MessageInput = memo(({ onSend }) => {
    const [value, setValue] = useState('')

    const handleSend = useCallback(() => {
        if (!value.trim()) return
        onSend(value.trim())
        setValue('')
    }, [value, onSend])

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
            }
        },
        [handleSend]
    )

    return (
        <div className='border-t border-gray-200 bg-white p-4'>
            <div className='flex gap-2'>
                <Input
                    placeholder='Nhập tin nhắn...'
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onPressEnter={handleKeyPress}
                    size='large'
                    className='flex-1'
                />
                <Button
                    type='primary'
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    size='large'
                    disabled={!value.trim()}
                >
                    Gửi
                </Button>
            </div>
        </div>
    )
})

MessageInput.displayName = 'MessageInput'

export default MessageInput
