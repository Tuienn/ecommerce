import { Typography, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Text } = Typography

const ReceiveMessage = ({ text, time, sender }) => {
    return (
        <div className='mb-3 flex justify-start'>
            <div className='flex max-w-[70%] gap-2'>
                <Avatar size={32} icon={<UserOutlined />} className='flex-shrink-0 bg-gray-400' />
                <div>
                    {sender && (
                        <Text type='secondary' className='mb-1 block text-xs'>
                            {sender}
                        </Text>
                    )}
                    <div className='rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 shadow-sm'>
                        <Text className='whitespace-pre-wrap break-words'>{text}</Text>
                    </div>
                    <div className='mt-1'>
                        <Text type='secondary' className='text-xs'>
                            {time}
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReceiveMessage
