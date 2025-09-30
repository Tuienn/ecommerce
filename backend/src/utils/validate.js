export const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
}
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}
