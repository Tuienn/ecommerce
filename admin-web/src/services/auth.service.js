import apiService from '../api/apiService'

class AuthService {
    static login(data) {
        return apiService('post', '/auth/login/email', null, data)
    }
}

export default AuthService
