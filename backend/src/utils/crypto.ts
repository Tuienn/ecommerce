import crypto from 'crypto'

/**
 * Sinh salt ngẫu nhiên để hash password
 */
const generateSalt = (length = 16): string => {
    return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash password bằng thuật toán PBKDF2 (SHA-512)
 * @param password Mật khẩu gốc
 * @returns Chuỗi hash gồm: iterations:salt:hash
 */
export const hashPassword = (password: string): string => {
    const salt = generateSalt()
    const iterations = 100_000 // số vòng lặp
    const keyLength = 64
    const digest = 'sha512'

    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex')

    // format lưu trữ trong DB
    return `${iterations}:${salt}:${derivedKey}`
}

/**
 * So sánh mật khẩu nhập vào với hash đã lưu
 * @param password Mật khẩu người dùng nhập
 * @param hashedValue Chuỗi hash từ DB (theo định dạng iterations:salt:hash)
 * @returns true nếu đúng, false nếu sai
 */
export const comparePassword = (password: string, hashedValue: string): boolean => {
    if (!hashedValue) return false

    try {
        const [iterationsStr, salt, storedHash] = hashedValue.split(':')
        const iterations = parseInt(iterationsStr, 10)
        const keyLength = 64
        const digest = 'sha512'

        const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex')

        // So sánh an toàn tránh timing attack
        const isMatch = crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(storedHash, 'hex'))

        return isMatch
    } catch (err) {
        console.error('comparePassword error:', err)
        return false
    }
}

/**
 * Hash token (refresh token) bằng SHA-256
 * Dùng SHA-256 vì refresh token đã là random string dài, không cần PBKDF2
 * @param token Token gốc
 * @returns Hash của token
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex')
}
