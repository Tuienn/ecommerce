export const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g
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

export const isValidRoleUser = (role: string) => {
    const validRoles = ['customer', 'admin', 'staff']
    return validRoles.includes(role)
}
