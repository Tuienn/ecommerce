import { Server, Socket } from 'socket.io'
import MessageService from '../modules/message/message.service'

interface SendMessageData {
    chatId: string
    senderId: string
    encryptedContent: string
    nonce: string
    messageCounter: number
}

export function initSocketHandler(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('🔌 User connected:', socket.id)

        // User joins room with userId
        socket.on('join', (userId: string) => {
            socket.join(userId)
            console.log(`👤 User ${userId} joined their room`)
        })

        // Join chat room
        socket.on('join_chat', (chatId: string) => {
            socket.join(chatId)
            console.log(`💬 Socket ${socket.id} joined chat ${chatId}`)
        })

        // Send message (encrypted) - server only saves & forwards
        socket.on('send_message', async (data: SendMessageData) => {
            try {
                const { chatId, senderId, encryptedContent, nonce, messageCounter } = data

                // Save message to DB
                const message = await MessageService.saveMessage(
                    chatId,
                    senderId,
                    encryptedContent,
                    nonce,
                    messageCounter
                )

                // Broadcast to chat room
                io.to(chatId).emit('receive_message', message)

                console.log(`📨 Message saved & broadcasted to chat ${chatId}`)
            } catch (error: any) {
                console.error('Error sending message:', error)
                socket.emit('error', { message: error.message })
            }
        })

        // Leave chat room
        socket.on('leave_chat', (chatId: string) => {
            socket.leave(chatId)
            console.log(`🚪 Socket ${socket.id} left chat ${chatId}`)
        })

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id)
        })
    })
}
