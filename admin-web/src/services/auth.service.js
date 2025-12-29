import apiService from '../api/apiService'

class AuthService {
    static login(data) {
        return apiService('post', '/auth/login/email', null, data)
    }

    static logout(refreshToken) {
        return apiService('post', '/auth/logout', null, { refreshToken })
    }
}

export default AuthService
