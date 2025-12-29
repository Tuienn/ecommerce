import apiService from '../api/apiService'

class UserService {
    // Lấy danh sách tất cả người dùng với pagination và filter
    static getAllUsers(params = {}) {
        return apiService('get', '/user', params)
    }

    // Lấy thông tin một người dùng
    static getUserById(id) {
        return apiService('get', `/user/${id}`)
    }

    // Tạo người dùng mới
    static createUser(data) {
        return apiService('post', '/user', null, data)
    }

    // Cập nhật người dùng
    static updateUser(id, data) {
        return apiService('put', `/user/${id}`, null, data)
    }

    // Xóa người dùng
    static deleteUser(id) {
        return apiService('delete', `/user/${id}`)
    }

    // Bật/tắt trạng thái người dùng
    static setActiveUser(id, isActive) {
        return apiService('patch', `/user/${id}/active`, null, { isActive })
    }
}

export default UserService
