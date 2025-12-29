import axios from 'axios'
import { clearToken, getAccessToken, getAuthToken, saveAccessToken } from '../lib/handleStorage'

// Không lấy token tại đây vì nó sẽ bị cố định
const API = axios.create({
    baseURL: import.meta.env['VITE_API_SERVICE_URL'] + '/v1/api',
    responseType: 'json',
    timeout: 20000
})

// Request interceptor để add token động
API.interceptors.request.use((config) => {
    const token = getAccessToken() // Lấy token fresh mỗi request
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Method là get, post, put, delete
export const apiService = async (method, url, params, data) => {
    try {
        const headers = data instanceof FormData ? {} : { 'Content-Type': 'application/json' }

        const res = await API({
            method,
            url,
            params,
            data,
            headers
        })

        return res.data
    } catch (error) {
        const originalRequest = error.config

        // Avoid infinite loop nếu refresh token endpoint cũng fail
        if (
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh-token')
        ) {
            originalRequest._retry = true
            const { refreshToken } = getAuthToken()

            if (refreshToken) {
                try {
                    const res = await API({
                        method: 'post',
                        url: '/auth/refresh-token',
                        data: {
                            refresh_token: refreshToken
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    if (res.data.code === 200) {
                        const access_token = res.data.data.access_token
                        saveAccessToken(access_token)

                        // Update token cho original request
                        originalRequest.headers.Authorization = `Bearer ${access_token}`
                        return API(originalRequest)
                    }

                    throw new Error(res.data.message || 'Refresh token failed')
                } catch (refreshError) {
                    console.error('Refresh token error:', refreshError)
                    clearToken()
                    window.location.reload()
                    return Promise.reject(refreshError)
                }
            } else {
                // Không có refresh token
                clearToken()
                window.location.reload()
                return Promise.reject(new Error('No refresh token available'))
            }
        }

        // Network errors
        if (!error.response) {
            throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet.')
        }

        throw new Error(error?.response?.data?.message || error?.message || 'Lỗi không xác định')
    }
}

export default apiService
