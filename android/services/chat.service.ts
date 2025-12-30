import { apiService } from '@/api/api-service'
import { IRegisterChatKeyData } from '@/types/chat'

class ChatService {
    // Chat APIs
    static createOrGetChat(participantIds: string[]) {
        return apiService('/chat/create', {
            method: 'POST',
            body: JSON.stringify({ participantIds })
        })
    }

    static getChatMessages(chatId: string, cursor: string | null = null, limit = 20) {
        let url = `/message/chat/${chatId}?limit=${limit}`
        if (cursor) {
            url += `&cursor=${cursor}`
        }
        return apiService(url)
    }

    // Chat Key APIs
    static registerChatKey(data: IRegisterChatKeyData) {
        return apiService('/chat-key/register', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    static getEncryptedKey(userId: string) {
        return apiService(`/chat-key/${userId}/encrypted-key`)
    }

    static getPublicKey(userId: string) {
        return apiService(`/chat-key/${userId}/public-key`)
    }

    static getUsersWithChatKey() {
        return apiService('/chat-key/users')
    }
}

export default ChatService
