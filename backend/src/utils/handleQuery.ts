import { hashPassword } from './crypto'

export const applyUpdate = async <T extends Record<string, any>>(
    oldData: T,
    newData: Partial<T>,
    allowedFields: string[] = []
): Promise<T> => {
    const updatedData: Record<string, any> = { ...oldData }
    for (const key of Object.keys(newData)) {
        if (allowedFields.length && !allowedFields.includes(key)) continue
        const newValue = newData[key]
        if (!newValue) continue

        if (key === 'password' && typeof newValue === 'string') {
            updatedData[key] = await hashPassword(newValue)
        } else {
            updatedData[key] = newValue
        }
    }
    return updatedData as T
}
