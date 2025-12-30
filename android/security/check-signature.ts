import DeviceInfo from 'react-native-device-info'
import { Platform } from 'react-native'

const VALID_FINGERPRINTS: string[] = ['YOUR_PRODUCTION_SHA256_FINGERPRINT_HERE']

/**
 * Chuẩn hóa fingerprint để so sánh (bỏ dấu :, viết hoa)
 */
function normalizeFingerprint(fingerprint: string): string {
    return fingerprint.replace(/:/g, '').toUpperCase().trim()
}

/**
 * Lấy fingerprint của signing certificate hiện tại
 * @returns SHA-256 fingerprint hoặc null nếu không lấy được
 */
export async function getSigningFingerprint(): Promise<string | null> {
    if (Platform.OS !== 'android') {
        // iOS có cơ chế code signing riêng của Apple
        return null
    }

    try {
        // Trả về signing certificate fingerprint của APK
        const fingerprint = await DeviceInfo.getFingerprint()
        console.log('[Security] APK Fingerprint:', fingerprint)
        return fingerprint
    } catch (error) {
        console.error('[Security] Error getting fingerprint:', error)
        return null
    }
}

/**
 * Kiểm tra fingerprint của APK có hợp lệ không
 * @returns true nếu fingerprint hợp lệ hoặc không thể kiểm tra (iOS/dev mode)
 * @returns false nếu fingerprint không khớp (APK bị repack)
 */
export async function isValidSignature(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        // iOS có cơ chế bảo vệ riêng từ App Store
        return true
    }

    // Trong development mode, bỏ qua kiểm tra
    if (__DEV__) {
        console.log('[Security] Skipping signature check in development mode')
        return true
    }

    try {
        const currentFingerprint = await getSigningFingerprint()

        if (!currentFingerprint) {
            console.warn('[Security] Could not retrieve APK fingerprint')
            // Trong production, nên return false để an toàn
            return false
        }

        const normalizedCurrent = normalizeFingerprint(currentFingerprint)

        // So sánh với danh sách fingerprint hợp lệ
        const isValid = VALID_FINGERPRINTS.some((validFp) => normalizeFingerprint(validFp) === normalizedCurrent)

        if (!isValid) {
            console.error('[Security] Invalid fingerprint detected!')
            console.error('[Security] Current:', normalizedCurrent)
            console.error('[Security] Expected one of:', VALID_FINGERPRINTS.map(normalizeFingerprint))
        } else {
            console.log('[Security] Signature verification passed')
        }

        return isValid
    } catch (error) {
        console.error('[Security] Error checking signature:', error)
        // Trong production, return false để an toàn
        return false
    }
}

/**
 * Lấy thông tin chi tiết về ứng dụng và thiết bị
 */
export async function getAppSecurityInfo() {
    return {
        // Thông tin ứng dụng
        bundleId: DeviceInfo.getBundleId(),
        version: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        applicationName: DeviceInfo.getApplicationName(),

        // Thông tin bảo mật
        fingerprint: await getSigningFingerprint(),
        isEmulator: await DeviceInfo.isEmulator(),

        // Thông tin thiết bị
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemVersion: DeviceInfo.getSystemVersion()
    }
}
