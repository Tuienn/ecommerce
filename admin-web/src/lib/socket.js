import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket = null

/**
 * Connect to socket server
 */
export const connectSocket = () => {
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
export const getSocket = () => socket

/**
 * Join user room
 */
export const joinUserRoom = (userId) => {
    if (!socket?.connected) return
    socket.emit('join', userId)
    console.log(`👤 Joined user room: ${userId}`)
}

/**
 * Join chat room
 */
export const joinChatRoom = (chatId) => {
    if (!socket?.connected) return
    socket.emit('join_chat', chatId)
    console.log(`💬 Joined chat room: ${chatId}`)
}

/**
 * Send encrypted message
 */
export const sendSocketMessage = ({ chatId, senderId, encryptedContent, nonce, messageCounter }) => {
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
export const onReceiveMessage = (callback) => {
    if (!socket) return
    socket.on('receive_message', callback)
}

/**
 * Unsubscribe from receive messages
 */
export const offReceiveMessage = (callback) => {
    if (!socket) return
    socket.off('receive_message', callback)
}

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
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
