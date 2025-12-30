import apiService from '../api/apiService'

class ChatService {
    // Chat APIs
    static createOrGetChat(participantIds) {
        return apiService('post', '/chat/create', null, { participantIds })
    }

    static getMyChats() {
        return apiService('get', '/chat/my-chats')
    }

    static getAllChatsAdmin() {
        return apiService('get', '/chat/admin/all-chats')
    }

    static getChatById(chatId) {
        return apiService('get', `/chat/${chatId}`)
    }

    // Message APIs
    static getChatMessages(chatId, cursor = null, limit = 20) {
        let url = `/message/chat/${chatId}?limit=${limit}`
        if (cursor) {
            url += `&cursor=${cursor}`
        }
        return apiService('get', url)
    }

    static getAllMessagesAdmin(cursor = null, limit = 50) {
        let url = `/message/admin/all?limit=${limit}`
        if (cursor) {
            url += `&cursor=${cursor}`
        }
        return apiService('get', url)
    }

    // Chat Key APIs
    static registerChatKey(data) {
        return apiService('post', '/chat-key/register', null, data)
    }

    static getEncryptedKey(userId) {
        return apiService('get', `/chat-key/${userId}/encrypted-key`)
    }

    static getPublicKey(userId) {
        return apiService('get', `/chat-key/${userId}/public-key`)
    }

    static getUsersWithChatKey() {
        return apiService('get', '/chat-key/users')
    }
}

export default ChatService
