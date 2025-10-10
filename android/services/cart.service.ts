import { apiService } from '@/api/api-service'

class CartService {
    static async getCarts(page: number = 1, limit: number = 10, productName?: string) {
        let url = `/cart?page=${page}&limit=${limit}`
        if (productName && productName.trim()) {
            url += `&productName=${encodeURIComponent(productName.trim())}`
        }
        return apiService(url)
    }

    static async addToCart(productId: string, quantity: number) {
        return apiService(`/cart/add`, {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        })
    }

    static async checkout(productIds: string[]) {
        return apiService(`/cart/checkout`, {
            method: 'POST',
            body: JSON.stringify({ productIds })
        })
    }

    static async updateCartItem(cartItemId: string, quantity: number) {
        return apiService(`/cart/item/${cartItemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity })
        })
    }

    static async removeCartItem(cartItemId: string) {
        return apiService(`/cart/item/${cartItemId}`, {
            method: 'DELETE'
        })
    }

    static async clearCart() {
        return apiService(`/cart/clear`, {
            method: 'DELETE'
        })
    }
}

export default CartService
