export const debounce = (func, wait) => {
    let timeout = null

    const debouncedFunction = (...args) => {
        if (timeout !== null) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
            func(...args)
        }, wait)
    }

    debouncedFunction.cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    return debouncedFunction
}

export const clearFalsyValueObject = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter((entry) => entry[1] !== null && entry[1] !== undefined))
}

export const queryString = (slashParams, params) => {
    const filteredParams = params ? clearFalsyValueObject(params) : null
    const queryString = filteredParams ? new URLSearchParams(filteredParams).toString() : null
    return `${slashParams.join('/')}${queryString ? '?' + queryString : ''}`
}

export const getFirstLetterName = (name) => {
    const groupStr = name.split(' ')
    return groupStr[groupStr.length - 1][0]
}
