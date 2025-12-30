import JailMonkey from 'jail-monkey'
import { Platform } from 'react-native'

/**
 * Kiểm tra thiết bị đã bị jailbreak (iOS) hoặc root (Android)
 * @returns true nếu thiết bị đã bị jailbreak/root
 */
export function isJailBroken(): boolean {
    return JailMonkey.isJailBroken()
}

/**
 * Phát hiện fake GPS / mock location
 * @returns true nếu phát hiện fake GPS
 */
export function canMockLocation(): boolean {
    // JailMonkey.canMockLocation() chỉ hoạt động trên Android
    if (Platform.OS === 'android') {
        return JailMonkey.canMockLocation()
    }
    return false
}

/**
 * Phát hiện chế độ debug
 * @returns true nếu app đang ở chế độ debug
 */
export async function isDebuggedMode(): Promise<boolean> {
    const isDebugged = await JailMonkey.isDebuggedMode()
    return isDebugged
}

/**
 * Kiểm tra tất cả các điều kiện bảo mật
 * @returns true nếu phát hiện bất kỳ vấn đề bảo mật nào
 */
export async function isUntrustedDevice(): Promise<boolean> {
    return isJailBroken() || canMockLocation() || (await isDebuggedMode())
}

/**
 * Lấy thông tin chi tiết về trạng thái bảo mật của thiết bị
 */
export async function getSecurityStatus() {
    return {
        isJailBroken: isJailBroken(),
        canMockLocation: canMockLocation(),
        isDebuggedMode: await isDebuggedMode(),
        isUntrusted: await isUntrustedDevice()
    }
}
