import { apiService } from '@/api/api-service'

class AuthSerice {
    static async getCurrentUserProfile() {
        return apiService('/auth')
    }

    static async refreshToken(refreshToken: string) {
        return apiService('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        })
    }

    static async logout(refreshToken: string) {
        return apiService('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        })
    }

    static async loginByEmail(email: string, password: string) {
        return apiService('/auth/login/email', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        })
    }

    static async registerAccount(name: string, email: string, password: string, phone: string, accessToken: string) {
        return apiService('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone }),
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
    }

    static async registerAccountOTP(email: string) {
        return apiService('/auth/otp/register/email', {
            method: 'POST',
            body: JSON.stringify({ email })
        })
    }

    static async verifyByEmailOTP(email: string, code: string) {
        return apiService('/auth/otp/verify/email', {
            method: 'POST',
            body: JSON.stringify({ email, code })
        })
    }

    static async registerPhoneOTP(phone: string) {
        return apiService('/auth/otp/register/phone', {
            method: 'POST',
            body: JSON.stringify({ phone })
        })
    }

    static async verifyPhoneOTP(phone: string, code: string) {
        return apiService('/auth/otp/verify/phone', {
            method: 'POST',
            body: JSON.stringify({ phone, code })
        })
    }

    static async getVerifyStatus(phone: string) {
        return apiService(`/auth/otp/verify-status/${phone}`)
    }
}

export default AuthSerice
