import { useState, useRef, useEffect, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { MessageCircle, LogIn, RefreshCw } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import ChatBox from '@/components/app/chat/chat-box'
import MessageInput from '@/components/app/chat/message-input'
import PasswordDialog from '@/components/app/chat/password-dialog'
import ChatService from '@/services/chat.service'
import { useAuth } from '@/hooks/use-auth'
import { getSecretChatKey, clearSecretChatKey } from '@/lib/secure-store'
import { deriveSharedKey, encryptMessage, decryptMessage } from '@/lib/tweetnacl'
import {
    connectSocket,
    joinUserRoom,
    joinChatRoom,
    sendSocketMessage,
    onReceiveMessage,
    offReceiveMessage,
    disconnectSocket
} from '@/lib/socket'
import { showNotification } from '@/lib/utils'
import { IChatMessage, IKeyPair } from '@/types/chat'

export default function ChatScreen() {
    const router = useRouter()
    const { user, isAuth } = useAuth()
    const userId = user?._id

    // Auth state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [isAutoLogging, setIsAutoLogging] = useState(true)

    // Chat state
    const [currentChat, setCurrentChat] = useState<any>(null)
    const [messages, setMessages] = useState<IChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)

    // Refs
    const myKeyPairRef = useRef<IKeyPair | null>(null)
    const sharedKeyRef = useRef<Uint8Array | null>(null)
    const messageCounterRef = useRef(0)

    // Socket message handler
    const handleReceiveMessage = useCallback(
        (msg: any) => {
            if (!sharedKeyRef.current) return

            try {
                const plaintext = decryptMessage(msg.encryptedContent, msg.nonce, sharedKeyRef.current)
                const senderId = msg.senderId._id || msg.senderId

                // Tin nhắn mới ở đầu array vì dùng inverted FlatList
                setMessages((prev) => [
                    {
                        text: plaintext,
                        sender: msg.senderId.name || msg.senderId.email || 'Admin',
                        isMine: senderId === userId,
                        time: new Date(msg.timestamp).toLocaleTimeString('vi-VN')
                    },
                    ...prev
                ])
            } catch (error) {
                console.error('Decrypt error:', error)
            }
        },
        [userId]
    )

    // Auto-login if secretKey exists
    useEffect(() => {
        const autoLogin = async () => {
            if (!userId) {
                setIsAutoLogging(false)
                setShowPasswordDialog(true)
                return
            }

            const savedKey = await getSecretChatKey()

            if (!savedKey) {
                setIsAutoLogging(false)
                setShowPasswordDialog(true)
                return
            }

            if (savedKey.oderId !== userId) {
                await clearSecretChatKey()
                setIsAutoLogging(false)
                setShowPasswordDialog(true)
                return
            }

            try {
                // Get public key from server
                const res = await ChatService.getPublicKey(userId)
                const publicKey = res.data?.publicKey

                if (publicKey) {
                    myKeyPairRef.current = {
                        publicKey,
                        secretKey: savedKey.secretKey
                    }
                    setShowPasswordDialog(false)
                    // Connect socket
                    connectSocket()
                    joinUserRoom(userId)
                    onReceiveMessage(handleReceiveMessage)
                    console.log('🔐 Auto-logged in with saved secret key')
                    // Auto start chat with admin
                    await startChatWithAdmin()
                } else {
                    setShowPasswordDialog(true)
                }
            } catch (error) {
                console.error('Auto-login failed:', error)
                await clearSecretChatKey()
                setShowPasswordDialog(true)
            } finally {
                setIsAutoLogging(false)
            }
        }

        autoLogin()

        return () => {
            offReceiveMessage(handleReceiveMessage)
            disconnectSocket()
        }
    }, [userId, handleReceiveMessage])

    // Start chat with admin
    const startChatWithAdmin = async () => {
        if (!userId || !myKeyPairRef.current) return

        try {
            setLoading(true)

            // Get users with chat key (find admin)
            const usersRes = await ChatService.getUsersWithChatKey()
            const users = usersRes.data || []

            // Find admin (filter out self)
            const admin = users.find((u: any) => {
                const uid = u.userId?._id || u.userId
                return String(uid) !== String(userId) && u.userId?.name === 'Administrator'
            })

            if (!admin) {
                showNotification('info', 'Không tìm thấy admin để chat. Vui lòng thử lại sau.')
                return
            }

            const partnerId = admin.userId?._id || admin.userId

            // Create or get chat
            const chatRes = await ChatService.createOrGetChat([userId, partnerId])
            const chat = chatRes.data
            setCurrentChat(chat)
            joinChatRoom(chat._id)

            // Derive shared key
            const partnerPubKey =
                admin.publicKey ||
                chat.participants.find((p: any) => {
                    const pid = p._id || p
                    return String(pid) !== String(userId)
                })?.publicKey

            if (partnerPubKey && myKeyPairRef.current?.secretKey) {
                sharedKeyRef.current = deriveSharedKey(partnerPubKey, myKeyPairRef.current.secretKey)
            }

            // Load messages
            await loadMessages(chat._id, null, false)
        } catch (error: any) {
            console.error('Start chat error:', error)
            showNotification('error', 'Không thể mở cuộc hội thoại')
        } finally {
            setLoading(false)
        }
    }

    // Load messages
    const loadMessages = async (chatId: string, cursor: string | null, isLoadingMore: boolean) => {
        if (!sharedKeyRef.current) return

        try {
            if (isLoadingMore) {
                setLoadingMore(true)
            }

            const res = await ChatService.getChatMessages(chatId, cursor, 20)
            console.log('🚀 ~ loadMessages ~ res:', res)
            const data = res.data || res

            const decryptedMessages: IChatMessage[] = []
            const messagesArray = data.messages || []

            // Không cần reverse vì inverted FlatList sẽ hiển thị ngược
            for (const msg of messagesArray) {
                try {
                    const plaintext = decryptMessage(msg.encryptedContent, msg.nonce, sharedKeyRef.current!)
                    decryptedMessages.push({
                        text: plaintext,
                        sender: msg.senderId?.name || msg.senderId?.email || 'Unknown',
                        isMine: String(msg.senderId?._id) === String(userId),
                        time: new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('vi-VN')
                    })
                } catch {
                    // Skip messages that can't be decrypted
                }

                if (msg.messageCounter >= messageCounterRef.current) {
                    messageCounterRef.current = msg.messageCounter + 1
                }
            }

            if (isLoadingMore) {
                // Load more = thêm messages cũ hơn vào cuối array (sẽ hiển thị ở trên với inverted)
                setMessages((prev) => [...prev, ...decryptedMessages])
            } else {
                setMessages(decryptedMessages)
            }

            setHasMore(data.hasMore || false)
            setNextCursor(data.nextCursor || null)
        } catch (error) {
            console.error('Load messages error:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (currentChat && hasMore && !loadingMore && nextCursor) {
            loadMessages(currentChat._id, nextCursor, true)
        }
    }, [currentChat, hasMore, loadingMore, nextCursor])

    // Handle send message
    const handleSendMessage = useCallback(
        (text: string) => {
            if (!text || !sharedKeyRef.current || !currentChat) return

            const { encryptedContent, nonce } = encryptMessage(text, sharedKeyRef.current, messageCounterRef.current)

            sendSocketMessage({
                chatId: currentChat._id,
                senderId: userId!,
                encryptedContent,
                nonce,
                messageCounter: messageCounterRef.current
            })

            messageCounterRef.current++
        },
        [currentChat, userId]
    )

    // Handle password dialog success
    const handleAuthSuccess = (keyPair: IKeyPair) => {
        myKeyPairRef.current = keyPair
        setShowPasswordDialog(false)
        // Connect socket
        connectSocket()
        joinUserRoom(userId!)
        onReceiveMessage(handleReceiveMessage)
        // Auto start chat
        startChatWithAdmin()
    }

    // Not authenticated - show login UI
    if (!isAuth) {
        return (
            <View className='flex-1 bg-background'>
                {/* Header */}
                <View className='border-b border-border bg-card px-4 py-4'>
                    <Text className='text-xl font-bold'>Hỗ trợ khách hàng</Text>
                </View>
                <View className='flex-1 items-center justify-center px-4'>
                    <View className='mb-6 h-32 w-32 items-center justify-center rounded-full bg-primary/10'>
                        <MessageCircle size={64} className='text-primary' />
                    </View>
                    <Text className='mb-2 text-center text-2xl font-bold'>Đăng nhập để chat với Admin</Text>
                    <Text className='mb-8 text-center text-base text-muted-foreground'>
                        Vui lòng đăng nhập để nhận hỗ trợ từ Admin
                    </Text>
                    <Button onPress={() => router.push('/(auth)/(login)/login-by-email')}>
                        <LogIn size={20} color='white' />
                        <Text>Đăng nhập ngay</Text>
                    </Button>
                </View>
            </View>
        )
    }

    // Loading state
    if (isAutoLogging) {
        return (
            <View className='flex-1 items-center justify-center bg-background'>
                <ActivityIndicator size='large' />
                <Text className='mt-4 text-muted-foreground'>Đang kết nối...</Text>
            </View>
        )
    }

    return (
        <View className='flex-1 bg-background'>
            {/* Password Dialog */}
            <PasswordDialog open={showPasswordDialog && !!userId} userId={userId || ''} onSuccess={handleAuthSuccess} />

            {/* Header */}
            <View className='flex-row items-center justify-between border-b border-border bg-card px-4 py-3'>
                <View className='flex-row items-center gap-3'>
                    <View className='h-10 w-10 items-center justify-center rounded-full bg-primary'>
                        <MessageCircle size={20} color='white' />
                    </View>
                    <View>
                        <Text className='font-semibold'>Hỗ trợ khách hàng</Text>
                        <Text className='text-sm text-muted-foreground'>Chat với Admin</Text>
                    </View>
                </View>
                {currentChat && (
                    <Button
                        variant='ghost'
                        size='icon'
                        onPress={() => loadMessages(currentChat._id, null, false)}
                        disabled={loading}
                    >
                        <RefreshCw size={20} className='text-muted-foreground' />
                    </Button>
                )}
            </View>

            {/* Chat Box */}
            <ChatBox
                messages={messages}
                loading={loading}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
            />

            {/* Message Input */}
            {currentChat && <MessageInput onSend={handleSendMessage} />}
        </View>
    )
}
