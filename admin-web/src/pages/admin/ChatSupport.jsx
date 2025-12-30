import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Card, Typography, Empty } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import UserList from '../../components/admin/chatSupport/UserList'
import ChatBox from '../../components/admin/chatSupport/ChatBox'
import MessageInput from '../../components/admin/chatSupport/MessageInput'
import PasswordModal from '../../components/admin/chatSupport/PasswordModal'
import ChatService from '../../services/chat.service'
import {
    connectSocket,
    joinUserRoom,
    joinChatRoom,
    sendSocketMessage,
    onReceiveMessage,
    offReceiveMessage,
    disconnectSocket
} from '../../lib/socket'
import { deriveSharedKey, encryptMessage, decryptMessage } from '../../lib/tweetnacl'
import { clearSecretChatKey, getAuthToken, getSecretChatKey } from '../../lib/handleStorage'
import { useApp } from '../../components/provider/AppProvider'

const { Text } = Typography

const ChatSupport = () => {
    const { showNotification } = useApp()
    const queryClient = useQueryClient()
    // Auth state
    const [showPasswordModal, setShowPasswordModal] = useState(true)
    const [isAutoLogging, setIsAutoLogging] = useState(true)
    const [autoLoginCompleted, setAutoLoginCompleted] = useState(false)

    // Chat state
    const [selectedUser, setSelectedUser] = useState(null)
    const [currentChat, setCurrentChat] = useState(null)
    const [messages, setMessages] = useState([])

    // Refs
    const myKeyPairRef = useRef(null)
    const sharedKeyRef = useRef(null)
    const messageCounterRef = useRef(0)

    // Get current admin user from storage
    const userId = getAuthToken()?._id

    // Initialize socket and subscribe to messages
    const initSocket = useCallback((connUserId, handleReceiveMessage) => {
        connectSocket()
        joinUserRoom(connUserId)
        if (handleReceiveMessage) {
            onReceiveMessage(handleReceiveMessage)
        }
    }, [])

    // Auto-login if secretKey exists
    useEffect(() => {
        const autoLogin = async () => {
            if (!userId) {
                setIsAutoLogging(false)
                return
            }

            const savedSecretKey = getSecretChatKey(userId)

            if (!savedSecretKey) {
                clearSecretChatKey()
                setIsAutoLogging(false)
                return
            }

            if (savedSecretKey.userId !== userId) {
                clearSecretChatKey()
                setIsAutoLogging(false)
                return
            }

            try {
                // Get public key from server
                const res = await ChatService.getPublicKey(userId)
                const publicKey = res.data?.publicKey

                if (publicKey) {
                    myKeyPairRef.current = {
                        publicKey,
                        secretKey: savedSecretKey.secretKey
                    }
                    setShowPasswordModal(false)
                    setAutoLoginCompleted(true)
                    // Init socket inline to avoid dependency issues
                    connectSocket()
                    joinUserRoom(userId)
                    console.log('🔐 Auto-logged in with saved secret key')
                }
            } catch (error) {
                console.error('Auto-login failed:', error)
                clearSecretChatKey()
            } finally {
                setIsAutoLogging(false)
            }
        }

        autoLogin()
    }, [userId])

    // Messages infinite query
    const {
        data: messagesData,
        isLoading: messagesLoading,
        isFetchingNextPage: loadingMoreMessages,
        hasNextPage: hasMoreMessages,
        fetchNextPage
    } = useInfiniteQuery({
        queryKey: ['chatMessages', currentChat?._id],
        queryFn: ({ pageParam = null }) => ChatService.getChatMessages(currentChat._id, pageParam, 20),
        enabled: !!currentChat?._id && !!sharedKeyRef.current,
        getNextPageParam: (lastPage) => lastPage.data?.nextCursor || undefined,
        select: (data) => {
            const allMessages = []
            for (const page of data.pages) {
                const messagesArray = page.data?.messages || []
                const messagesReversed = [...messagesArray].reverse()

                for (const msg of messagesReversed) {
                    if (sharedKeyRef.current) {
                        try {
                            const plaintext = decryptMessage(msg.encryptedContent, msg.nonce, sharedKeyRef.current)
                            allMessages.push({
                                text: plaintext,
                                sender: msg.senderId?.name || msg.senderId?.email || 'User',
                                isMine: String(msg.senderId?._id) === String(userId),
                                time: new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('vi-VN')
                            })
                        } catch {
                            // Skip messages that can't be decrypted
                        }
                    }

                    if (msg.messageCounter >= messageCounterRef.current) {
                        messageCounterRef.current = msg.messageCounter + 1
                    }
                }
            }
            return allMessages
        }
    })

    // Combine query messages with socket messages
    const displayMessages = useMemo(() => {
        const queryMessages = messagesData || []
        return [...queryMessages, ...messages]
    }, [messagesData, messages])

    // Create/Get chat mutation
    const createChatMutation = useMutation({
        mutationFn: ({ partnerId }) => ChatService.createOrGetChat([userId, partnerId]),
        onSuccess: (res, { user }) => {
            const chat = res.data
            setCurrentChat(chat)
            joinChatRoom(chat._id)

            const partnerPubKey =
                user.publicKey ||
                chat.participants.find((p) => {
                    const pid = p._id || p
                    return String(pid) !== String(userId)
                })?.publicKey

            if (partnerPubKey && myKeyPairRef.current?.secretKey) {
                sharedKeyRef.current = deriveSharedKey(partnerPubKey, myKeyPairRef.current.secretKey)
            }

            // Reset messages for new chat
            setMessages([])
            queryClient.invalidateQueries({ queryKey: ['chatMessages', chat._id] })
        },
        onError: (error) => {
            console.error('Select user error:', error)
            showNotification('error', 'Không thể mở cuộc hội thoại')
        }
    })

    // Socket message handler
    const handleReceiveMessage = useCallback(
        (msg) => {
            if (!sharedKeyRef.current) return

            try {
                const plaintext = decryptMessage(msg.encryptedContent, msg.nonce, sharedKeyRef.current)
                const senderId = msg.senderId._id || msg.senderId

                setMessages((prev) => [
                    ...prev,
                    {
                        text: plaintext,
                        sender: msg.senderId.name || msg.senderId.email || 'User',
                        isMine: senderId === userId,
                        time: new Date(msg.timestamp).toLocaleTimeString('vi-VN')
                    }
                ])
            } catch (error) {
                console.error('Decrypt error:', error)
            }
        },
        [userId]
    )

    // Register socket listener after auto-login completed
    useEffect(() => {
        if (autoLoginCompleted) {
            onReceiveMessage(handleReceiveMessage)
            console.log('🔔 Socket listener registered after auto-login')
        }
    }, [autoLoginCompleted, handleReceiveMessage])

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            offReceiveMessage(handleReceiveMessage)
            disconnectSocket()
        }
    }, [handleReceiveMessage])

    // Handlers
    const handleAuthSuccess = useCallback(() => {
        setShowPasswordModal(false)
        initSocket(userId, handleReceiveMessage)
    }, [userId, initSocket, handleReceiveMessage])

    const handleSelectUser = (user) => {
        const partnerId = user.userId?._id || user.userId
        setSelectedUser(user)
        setMessages([])
        createChatMutation.mutate({ partnerId, user })
    }

    const handleLoadMoreMessages = useCallback(() => {
        if (hasMoreMessages && !loadingMoreMessages) {
            fetchNextPage()
        }
    }, [hasMoreMessages, loadingMoreMessages, fetchNextPage])

    const handleSendMessage = useCallback(
        (text) => {
            if (!text || !sharedKeyRef.current || !currentChat) return

            const { encryptedContent, nonce } = encryptMessage(text, sharedKeyRef.current, messageCounterRef.current)

            sendSocketMessage({
                chatId: currentChat._id,
                senderId: userId,
                encryptedContent,
                nonce,
                messageCounter: messageCounterRef.current
            })

            messageCounterRef.current++
        },
        [currentChat, userId]
    )

    return (
        <div className='h-[calc(100vh-120px)] p-4'>
            <PasswordModal
                open={showPasswordModal && !isAutoLogging}
                userId={userId}
                myKeyPairRef={myKeyPairRef}
                onSuccess={handleAuthSuccess}
            />

            <Card className='h-full' bodyStyle={{ padding: 0, height: '100%' }}>
                <div className='flex h-full'>
                    {/* Left sidebar - User list */}
                    <div className='w-80 border-r border-gray-200'>
                        <UserList
                            enabled={!showPasswordModal}
                            userId={userId}
                            selectedUserId={selectedUser?.userId?._id || selectedUser?.userId}
                            onSelectUser={handleSelectUser}
                        />
                    </div>

                    {/* Right side - Chat area */}
                    <div className='flex flex-1 flex-col'>
                        {/* Chat header */}
                        {selectedUser && (
                            <div className='border-b border-gray-200 bg-gray-50 p-4'>
                                <div className='flex items-center gap-3'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500'>
                                        <UserOutlined className='text-white' />
                                    </div>
                                    <div>
                                        <Text strong>
                                            {selectedUser.userId?.name || selectedUser.userId?.email || 'Khách hàng'}
                                        </Text>
                                        <br />
                                        <Text type='secondary' className='text-xs'>
                                            {selectedUser.userId?.email || ''}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat messages */}
                        <div className='flex-1 overflow-hidden bg-gray-50'>
                            {selectedUser ? (
                                <ChatBox
                                    messages={displayMessages}
                                    loading={messagesLoading || createChatMutation.isPending}
                                    hasMore={hasMoreMessages}
                                    loadingMore={loadingMoreMessages}
                                    onLoadMore={handleLoadMoreMessages}
                                />
                            ) : (
                                <div className='flex h-full items-center justify-center'>
                                    <Empty
                                        description='Chọn một cuộc hội thoại để bắt đầu'
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Message input */}
                        {selectedUser && <MessageInput onSend={handleSendMessage} />}
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ChatSupport
