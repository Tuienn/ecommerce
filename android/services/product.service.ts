import { apiService } from '@/api/api-service'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/common'

class ProductService {
    static async simpleSearchProducts(
        name?: string,
        categoryIds?: string[],
        isFeatured?: boolean,
        sortDiscount?: 'asc' | 'desc',
        sortPrice?: 'asc' | 'desc',
        page: number = DEFAULT_PAGE,
        limit: number = DEFAULT_LIMIT
    ) {
        // Build query parameters, only include defined values
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())

        if (name && name.trim()) {
            params.append('name', name.trim())
        }

        if (categoryIds && categoryIds.length > 0) {
            params.append('categoryIds', categoryIds.join(','))
        }

        if (typeof isFeatured === 'boolean') {
            params.append('isFeatured', isFeatured.toString())
        }

        if (sortPrice) {
            params.append('sortPrice', sortPrice)
        }

        if (sortDiscount) {
            params.append('sortDiscount', sortDiscount)
        }

        return apiService(`/product/simple-search?${params.toString()}`)
    }

    static async getProductById(id: string) {
        return apiService(`/product/${id}`)
    }
}

export default ProductService
