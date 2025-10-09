import { clsx, type ClassValue } from 'clsx'
import Toast from 'react-native-toast-message'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const showNotification = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    let titleToast = ''
    switch (type) {
        case 'success':
            titleToast = 'Thành công'
            break
        case 'error':
            titleToast = 'Lỗi'
            break
        case 'info':
            titleToast = 'Thông tin'
            break
    }

    return Toast.show({
        type,
        text1: title ?? titleToast,
        text2: message,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true
    })
}
