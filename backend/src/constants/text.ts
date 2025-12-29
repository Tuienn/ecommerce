export const AUTH = {
    INVALID_ACCESS_TOKEN: 'Access token không hợp lệ hoặc đã hết hạn',
    INVALID_REFRESH_TOKEN: 'Refresh token không hợp lệ hoặc đã hết hạn',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    ACCOUNT_DISABLED: 'Tài khoản đã bị vô hiệu hoá',
    OTP_EXPIRED: 'Token OTP không hợp lệ hoặc đã hết hạn',
    INVALID_ACCOUNT: 'Tài khoản hoặc mật khẩu không đúng',
    // Google Auth
    GOOGLE_ACCOUNT_NOT_FOUND: 'Tài khoản Google chưa được đăng ký',
    GOOGLE_ID_REQUIRED: 'Thiếu Google ID',
    GOOGLE_EMAIL_REQUIRED: 'Thiếu email từ Google'
}

export const CART = {
    NOT_FOUND: 'Không tìm thấy giỏ hàng',
    EMPTY: 'Giỏ hàng trống',
    ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong giỏ hàng',
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    PRODUCT_INACTIVE: 'Sản phẩm đã ngừng kinh doanh',
    INSUFFICIENT_STOCK: 'Số lượng sản phẩm không đủ'
}

export const missingDataField = (field: string) => `Thiếu trường dữ liệu: ${field}`
export const invalidDataField = (field: string) => `Trường dữ liệu không hợp lệ: ${field}`
export const existedDataField = (field: string) => `Trường dữ liệu đã tồn tại: ${field}`

export const SERVER = {
    ERROR: 'Lỗi máy chủ, vui lòng thử lại sau'
}
