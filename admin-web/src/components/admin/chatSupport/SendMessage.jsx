import { Typography } from 'antd'

const { Text } = Typography

const SendMessage = ({ text, time }) => {
    return (
        <div className='mb-3 flex justify-end'>
            <div className='max-w-[70%]'>
                <div className='rounded-2xl rounded-br-md bg-blue-500 px-4 py-2 text-white shadow-sm'>
                    <Text className='whitespace-pre-wrap break-words !text-white'>{text}</Text>
                </div>
                <div className='mt-1 text-right'>
                    <Text type='secondary' className='text-xs'>
                        {time}
                    </Text>
                </div>
            </div>
        </div>
    )
}

export default SendMessage
