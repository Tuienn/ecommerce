import apiService from '../api/apiService'

class ProductService {
    // Lấy danh sách tất cả sản phẩm với pagination
    static getAllProducts(params = {}) {
        return apiService('get', '/product', params)
    }

    // Tìm kiếm sản phẩm
    static searchProducts(params) {
        return apiService('get', '/product/search', params)
    }

    // Lấy thông tin một sản phẩm
    static getProductById(id) {
        return apiService('get', `/product/${id}`)
    }

    // Tạo sản phẩm mới (với upload ảnh)
    static createProduct(formData) {
        return apiService('post', '/product/upload', null, formData)
    }

    // Cập nhật sản phẩm (không upload ảnh mới)
    static updateProduct(id, data) {
        return apiService('put', `/product/${id}`, null, data)
    }

    // Cập nhật sản phẩm (có upload ảnh mới)
    static updateProductWithUpload(id, formData) {
        return apiService('put', `/product/${id}/upload`, null, formData)
    }

    // Xóa sản phẩm
    static deleteProduct(id) {
        return apiService('delete', `/product/${id}`)
    }

    // Bật/tắt trạng thái sản phẩm
    static setActiveProduct(id, isActive) {
        return apiService('patch', `/product/${id}/active`, null, { isActive })
    }
}

export default ProductService
