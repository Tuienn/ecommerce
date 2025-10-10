import { apiService } from '@/api/api-service'
import { CreateOrderData } from '@/types/order'

class OrderService {
    static async createOrder(orderData: CreateOrderData) {
        return apiService(`/order`, {
            method: 'POST',
            body: JSON.stringify(orderData)
        })
    }

    static async getOrders(status?: string, page: number = 1, limit: number = 10) {
        const statusParam = status ? `&status=${status}` : ''
        return apiService(`/order/simple?page=${page}&limit=${limit}${statusParam}`)
    }

    static async getOrderById(orderId: string) {
        return apiService(`/order/${orderId}`)
    }

    static async cancelOrder(orderId: string) {
        return apiService(`/order/${orderId}/cancel`, {
            method: 'POST'
        })
    }
}

export default OrderService
