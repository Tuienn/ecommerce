import { useEffect, useRef, useCallback } from 'react'
import { Spin, Empty, Typography, Divider } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import SendMessage from './SendMessage'
import ReceiveMessage from './ReceiveMessage'

const { Text } = Typography

const ChatBox = ({ messages, loading, hasMore, loadingMore, onLoadMore }) => {
    const chatBoxRef = useRef(null)
    const shouldScrollToBottomRef = useRef(true)

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatBoxRef.current && shouldScrollToBottomRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
        }
    }, [messages])

    // Handle scroll for infinite loading
    const handleScroll = useCallback(() => {
        const chatBox = chatBoxRef.current
        if (!chatBox) return

        // Load more when scrolled near top
        if (chatBox.scrollTop < 100 && hasMore && !loadingMore) {
            const previousScrollHeight = chatBox.scrollHeight
            shouldScrollToBottomRef.current = false
            onLoadMore()

            // Maintain scroll position after loading
            setTimeout(() => {
                const newScrollHeight = chatBox.scrollHeight
                chatBox.scrollTop = newScrollHeight - previousScrollHeight
                shouldScrollToBottomRef.current = true
            }, 100)
        }
    }, [hasMore, loadingMore, onLoadMore])

    useEffect(() => {
        const chatBox = chatBoxRef.current
        if (!chatBox) return

        chatBox.addEventListener('scroll', handleScroll)
        return () => chatBox.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    if (loading) {
        return (
            <div className='flex h-full items-center justify-center'>
                <Spin indicator={<LoadingOutlined spin />} tip='Đang tải tin nhắn...' />
            </div>
        )
    }

    if (!messages || messages.length === 0) {
        return (
            <div className='flex h-full items-center justify-center'>
                <Empty description='Chưa có tin nhắn nào' image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
        )
    }

    return (
        <div ref={chatBoxRef} className='h-full overflow-y-auto bg-white px-4 py-4'>
            {/* Load more indicator */}
            {loadingMore && (
                <div className='py-2 text-center'>
                    <Spin size='small' />
                    <Text type='secondary' className='ml-2 text-xs'>
                        Đang tải thêm...
                    </Text>
                </div>
            )}

            {hasMore && !loadingMore && (
                <div className='py-2 text-center'>
                    <Text type='secondary' className='text-xs'>
                        ↑ Cuộn lên để xem tin nhắn cũ hơn
                    </Text>
                </div>
            )}

            {hasMore && <Divider className='!my-2' />}

            {/* Messages */}
            {messages.map((msg, idx) =>
                msg.isMine ? (
                    <SendMessage key={idx} text={msg.text} time={msg.time} />
                ) : (
                    <ReceiveMessage key={idx} text={msg.text} time={msg.time} sender={msg.sender} />
                )
            )}
        </div>
    )
}

export default ChatBox
