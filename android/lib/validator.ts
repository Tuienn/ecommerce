export const isValidVNIPhoneNumber = (phoneNumber: string) => {
    const regexPhoneNumber = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g

    return regexPhoneNumber.test(phoneNumber)
}

export const isEmpty = (value: any) => {
    return value === null || value === undefined || value === ''
}

export const compateTwoObject = (obj1: any, obj2: any) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export const isValidNumber = (value: string) => {
    const regexNumber = /^[0-9]+$/

    return regexNumber.test(value)
}

export const isValidEmail = (value: string) => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    return regexEmail.test(value)
}

export const isValidOTP = (value: string) => {
    const regexOTP = /^[0-9]{6}$/

    return regexOTP.test(value)
}
