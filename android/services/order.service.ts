import { apiService } from '@/api/api-service'

interface CreateOrderData {
    items: Array<{
        productId: string
        quantity: number
    }>
    shippingAddress: string
    payment: {
        provider: 'MOMO' | 'VNPAY'
        amount: number
    }
}

class OrderService {
    static async createOrder(orderData: CreateOrderData) {
        return apiService(`/order`, {
            method: 'POST',
            body: JSON.stringify(orderData)
        })
    }
}

export default OrderService
