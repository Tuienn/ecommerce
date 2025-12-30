import { memo, useRef, useCallback } from 'react'
import { FlatList, View, ActivityIndicator, ListRenderItem } from 'react-native'
import { Text } from '@/components/ui/text'
import SendMessage from './send-message'
import ReceiveMessage from './receive-message'
import { IChatMessage } from '@/types/chat'

interface ChatBoxProps {
    messages: IChatMessage[]
    loading?: boolean
    hasMore?: boolean
    loadingMore?: boolean
    onLoadMore?: () => void
}

const ChatBox = memo(({ messages, loading, loadingMore, onLoadMore }: ChatBoxProps) => {
    const flatListRef = useRef<FlatList>(null)

    const renderItem: ListRenderItem<IChatMessage> = useCallback(
        ({ item }) =>
            item.isMine ? (
                <SendMessage text={item.text} time={item.time} />
            ) : (
                <ReceiveMessage text={item.text} sender={item.sender} time={item.time} />
            ),
        []
    )

    const renderFooter = useCallback(() => {
        if (!loadingMore) return null
        return (
            <View className='items-center py-2'>
                <ActivityIndicator size='small' />
            </View>
        )
    }, [loadingMore])

    const renderEmpty = useCallback(
        () => (
            <View className='flex-1 items-center justify-center py-20'>
                <Text className='text-muted-foreground'>Chưa có tin nhắn nào</Text>
                <Text className='mt-1 text-sm text-muted-foreground'>Hãy bắt đầu cuộc trò chuyện!</Text>
            </View>
        ),
        []
    )

    if (loading) {
        return (
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size='large' />
                <Text className='mt-2 text-muted-foreground'>Đang tải tin nhắn...</Text>
            </View>
        )
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            inverted
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, flexGrow: 1 }}
        />
    )
})

ChatBox.displayName = 'ChatBox'

export default ChatBox
