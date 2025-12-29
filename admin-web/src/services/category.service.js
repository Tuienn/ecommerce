import apiService from '../api/apiService'

class CategoryService {
    // Lấy danh sách tất cả danh mục
    static getAllCategories() {
        return apiService('get', '/category')
    }

    // Lấy thông tin một danh mục
    static getCategoryById(id) {
        return apiService('get', `/category/${id}`)
    }

    // Tạo danh mục mới
    static createCategory(data) {
        return apiService('post', '/category', null, data)
    }

    // Cập nhật danh mục
    static updateCategory(id, data) {
        return apiService('put', `/category/${id}`, null, data)
    }

    // Xóa danh mục
    static deleteCategory(id) {
        return apiService('delete', `/category/${id}`)
    }

    // Bật/tắt trạng thái danh mục
    static setActiveCategory(id, isActive) {
        return apiService('patch', `/category/${id}/active`, null, { isActive })
    }
}

export default CategoryService
