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
        return apiService(
            `/product/simple-search?page=${page}&limit=${limit}&name=${name}&categoryIds=${categoryIds}&isFeatured=${isFeatured}&sortPrice=${sortPrice}&sortDiscount=${sortDiscount}`
        )
    }
}

export default ProductService
