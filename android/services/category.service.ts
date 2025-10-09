import { apiService } from '@/api/api-service'

class CategoryService {
    static async getAllCategories() {
        const response = await apiService('/category')
        return response.data
    }
}

export default CategoryService
