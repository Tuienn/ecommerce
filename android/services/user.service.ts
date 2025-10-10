import { apiService } from '@/api/api-service'

class UserService {
    static async getAddresses() {
        return apiService('/user/address')
    }
}

export default UserService
