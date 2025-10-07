export const AUTH = {
    INVALID_ACCESS_TOKEN: 'Access token không hợp lệ hoặc đã hết hạn',
    INVALID_REFRESH_TOKEN: 'Refresh token không hợp lệ hoặc đã hết hạn',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    ACCOUNT_DISABLED: 'Tài khoản đã bị vô hiệu hoá',
    OTP_EXPIRED: 'Token OTP không hợp lệ hoặc đã hết hạn',
    INVALID_ACCOUNT: 'Tài khoản hoặc mật khẩu không đúng'
}

export const missingDataField = (field: string) => `Thiếu trường dữ liệu: ${field}`
export const invalidDataField = (field: string) => `Trường dữ liệu không hợp lệ: ${field}`
export const existedDataField = (field: string) => `Trường dữ liệu đã tồn tại: ${field}`

export const SERVER = {
    ERROR: 'Lỗi máy chủ, vui lòng thử lại sau'
}
