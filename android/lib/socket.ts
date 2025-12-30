import { SOCKET_URL } from '@/constants/config'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

interface SendMessageData {
    chatId: string
    senderId: string
    encryptedContent: string
    nonce: string
    messageCounter: number
}

type MessageCallback = (message: any) => void

/**
 * Connect to socket server
 */
export const connectSocket = (): Socket | null => {
    if (socket?.connected) return socket

    socket = io(SOCKET_URL)

    socket.on('connect', () => {
        console.log('🔌 Socket connected')
    })

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected')
    })

    return socket
}

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => socket

/**
 * Join user room
 */
export const joinUserRoom = (userId: string): void => {
    if (!socket?.connected) return
    socket.emit('join', userId)
    console.log(`👤 Joined user room: ${userId}`)
}

/**
 * Join chat room
 */
export const joinChatRoom = (chatId: string): void => {
    if (!socket?.connected) return
    socket.emit('join_chat', chatId)
    console.log(`💬 Joined chat room: ${chatId}`)
}

/**
 * Send encrypted message
 */
export const sendSocketMessage = ({
    chatId,
    senderId,
    encryptedContent,
    nonce,
    messageCounter
}: SendMessageData): void => {
    if (!socket?.connected) return
    socket.emit('send_message', {
        chatId,
        senderId,
        encryptedContent,
        nonce,
        messageCounter
    })
}

/**
 * Subscribe to receive messages
 */
export const onReceiveMessage = (callback: MessageCallback): void => {
    if (!socket) return
    socket.on('receive_message', callback)
}

/**
 * Unsubscribe from receive messages
 */
export const offReceiveMessage = (callback: MessageCallback): void => {
    if (!socket) return
    socket.off('receive_message', callback)
}

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect()
        socket = null
        console.log('🔌 Socket manually disconnected')
    }
}

export default {
    connectSocket,
    getSocket,
    joinUserRoom,
    joinChatRoom,
    sendSocketMessage,
    onReceiveMessage,
    offReceiveMessage,
    disconnectSocket
}
