import axios from 'axios'

const API = axios.create({
    baseURL: process.env.KEY_MANAGEMENT_SERVER_URL,
    responseType: 'json',
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'x-internal-secret': process.env.KEY_MANAGEMENT_SERVER_INTERNAL_KEY
    }
})

const keyManagementApi = async <T = any>(method: string, url: string, params?: any, data?: any): Promise<T> => {
    try {
        const res = await API({
            method,
            url,
            params,
            data
        })

        return res.data
    } catch (error) {
        throw error
    }
}

export default keyManagementApi
