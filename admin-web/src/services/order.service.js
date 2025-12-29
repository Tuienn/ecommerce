import apiService from '../api/apiService'

class OrderService {
    // Admin: Lấy tất cả đơn hàng
    static getAllOrders(params = {}) {
        return apiService('get', '/order/admin/all', params)
    }

    // Lấy thông tin một đơn hàng
    static getOrderById(id) {
        return apiService('get', `/order/${id}`)
    }

    // Cập nhật trạng thái đơn hàng
    static updateOrderStatus(id, status) {
        return apiService('put', `/order/${id}/update-order-status`, null, { status })
    }

    // Xác minh trạng thái thanh toán
    static verifyBankStatus(id, paymentStatus, transactionId) {
        return apiService('put', `/order/${id}/verify-bank-status`, null, { paymentStatus, transactionId })
    }
}

export default OrderService
