import { apiService } from '@/api/api-service'

class UserService {
    static async getAddresses() {
        return apiService('/user/address')
    }

    static async addAddress(addressData: {
        name: string
        phone: string
        addressLine: string
        city: string
        ward: string
        isDefault?: boolean
        location?: {
            type: 'Point'
            coordinates: [number, number]
        }
    }) {
        return apiService('/user/address', {
            method: 'POST',
            body: JSON.stringify(addressData)
        })
    }

    static async updateAddress(
        addressId: string,
        addressData: {
            name: string
            phone: string
            addressLine: string
            city: string
            ward: string
            isDefault?: boolean
            location?: {
                type: 'Point'
                coordinates: [number, number]
            }
        }
    ) {
        return apiService(`/user/address/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(addressData)
        })
    }

    static async setDefaultAddress(addressId: string) {
        return apiService(`/user/address/${addressId}/default`, {
            method: 'PATCH'
        })
    }

    static async deleteAddress(addressId: string) {
        return apiService(`/user/address/${addressId}`, {
            method: 'DELETE'
        })
    }
}

export default UserService
