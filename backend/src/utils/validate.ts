export const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
}

export const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const isValidPassword = (password: string) => {
    // Tối thiểu 6 kí tự
    return typeof password === 'string' && password.length >= 6
}
