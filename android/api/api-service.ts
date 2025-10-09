import { BASE_URL } from '@/constants/config'
import { getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken, clearAuthToken } from '@/lib/secure-store'

const REFRESH_PATH = '/auth/refresh-token'
const LOGIN_PATH = '/auth/login'

export const apiService = async <T = any>(url: string, options?: RequestInit, _retried = false): Promise<T> => {
    const token = await getAccessToken().catch(() => undefined)
    const defaultHeaders = {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }

    const mergedHeaders = new Headers({
        ...(options?.body instanceof FormData
            ? { ...defaultHeaders }
            : {
                  ...defaultHeaders,
                  'Content-Type': 'application/json'
              }),
        ...(options?.headers as Record<string, string> | undefined)
    })

    if (token && !url.startsWith(REFRESH_PATH)) {
        mergedHeaders.set('Authorization', `Bearer ${token}`)
    }

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: mergedHeaders
    })

    const data = await res.json()

    if (res.ok) {
        return (data ?? (undefined as unknown)) as T
    }

    // Nếu 401/403 => thử refresh đúng 1 lần (không áp dụng cho chính endpoint refresh)
    if (
        (res.status === 401 || res.status === 403) &&
        !_retried &&
        !url.startsWith(REFRESH_PATH) &&
        !url.startsWith(LOGIN_PATH)
    ) {
        const refreshToken = await getRefreshToken().catch(() => undefined)
        if (!refreshToken) {
            await clearAuthToken()
            throw new Error('Phiên đăng nhập đã hết hạn (không có refresh token).')
        }

        // Gọi refresh (KHÔNG gửi Authorization)
        const refreshRes = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        })

        const refreshData = await refreshRes.json()

        if (!refreshRes.ok || !refreshData?.data?.accessToken) {
            await clearAuthToken()

            throw new Error(refreshData?.message || `Refresh token thất bại (HTTP ${refreshRes.status})`)
        }

        // 5.2) Lưu token mới
        await saveAccessToken(refreshData.data.accessToken)
        if (refreshData.data.refreshToken) {
            await saveRefreshToken(refreshData.data.refreshToken)
        }

        // Retry lại request gốc đúng 1 lần với token mới
        return apiService<T>(url, options, true)
    }

    // 6) Các lỗi khác: ném message hợp lý
    const message = data?.message || `HTTP ${res.status} ${res.statusText || ''}`.trim()
    throw new Error(message)
}
