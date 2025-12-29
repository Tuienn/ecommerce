import { existedDataField } from './../../constants/text'
import { User } from '../index.model'
import { ConflictRequestError, NotFoundError } from '../../exceptions/error.handler'
import { IAddress, IUser } from '../../types/user'
import { RootFilterQuery } from 'mongoose'
import { AUTH } from '../../constants/text'
import { hashPassword } from '../../utils/crypto'
import KeyManagementApiService from '../../httpClients/keyManagement/keyManagement.service'

const { DEFAULT_EMAIL_ADMIN, DEFAULT_PASSWORD_ADMIN } = process.env

class UserService {
    /**
     * Helper function để giải mã các trường nhạy cảm trong address
     */
    private static async decryptAddressData(address: IAddress): Promise<any> {
        if (!address?.dek) {
            // Nếu không có DEK (địa chỉ cũ chưa được mã hóa), trả về nguyên bản
            return address
        }

        const decryptedData = await KeyManagementApiService.decryptDataByApi(
            {
                name: address.name,
                phone: address.phone,
                addressLine: address.addressLine
            },
            address.dek
        )

        return {
            _id: address._id,
            city: address.city,
            ward: address.ward,
            isDefault: address.isDefault,
            location: address.location,
            name: decryptedData.name,
            phone: decryptedData.phone,
            addressLine: decryptedData.addressLine
        }
    }

    static async createDefaultAdmin() {
        const existingAdmin = await User.findOne({ email: DEFAULT_EMAIL_ADMIN })

        if (!existingAdmin) {
            const defaultAdmin = await User.create({
                name: 'Administrator',
                email: DEFAULT_EMAIL_ADMIN,
                password: DEFAULT_PASSWORD_ADMIN,
                role: 'admin',
                phone: '0942029130'
            })

            console.log('Default admin user created successfully')
            return defaultAdmin
        } else {
            const existingAdmin = await User.findOneAndUpdate(
                { email: DEFAULT_EMAIL_ADMIN },
                {
                    $setOnInsert: {
                        name: 'Administrator',
                        password: DEFAULT_PASSWORD_ADMIN,
                        role: 'admin',
                        isActive: true
                    }
                },
                { upsert: true, new: true }
            )
            console.log('Default admin user already exists')
            return existingAdmin
        }
    }

    static async createUser(data: IUser) {
        const { name, email, password, role, phone } = data

        const existingUser = await this.checkIsExists({ email })
        if (existingUser) {
            throw new ConflictRequestError(existedDataField('email'))
        }

        const phoneNumber = await this.checkIsExists({ phone })
        if (phoneNumber) {
            throw new ConflictRequestError(existedDataField('số điện thoại'))
        }

        const newUser = await User.create({
            name,
            email,
            password,
            phone,
            role
        })

        const { password: _, ...userWithoutPassword } = newUser.toObject()

        return userWithoutPassword
    }

    static async getAllUsers(query?: { page?: number; limit?: number; isActive?: boolean; role?: string }) {
        const page = query?.page || 1
        const limit = query?.limit || 10
        const filter: any = {}

        if (typeof query?.isActive === 'boolean') {
            filter.isActive = query.isActive
        }

        if (query?.role) {
            filter.role = query.role
        }

        const users = await User.find(filter)
            .select('-password')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const total = await User.countDocuments(filter)

        return {
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getUserById(userId: string) {
        const user = await User.findById(userId).select('-password')

        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        return user
    }

    static async updateUser(userId: string, data: IUser) {
        const { email, role, password, isActive, name, phone } = data

        const user = (await this.getUserById(userId)).toObject()
        if (user.role === 'admin' && user.email === DEFAULT_EMAIL_ADMIN) {
            throw new ConflictRequestError('Không thể cập nhật tài khoản admin chính')
        }

        if (email && email !== user.email) {
            const existingUser = await this.checkIsExists({ email })
            if (existingUser) {
                throw new ConflictRequestError(existedDataField('email'))
            }
        }

        if (email) user.email = email
        if (name) user.name = name
        if (role) user.role = role
        if (phone) user.phone = phone
        if (password) {
            user.password = hashPassword(password)
        }
        if (typeof isActive === 'boolean') user.isActive = isActive

        user.save()

        return user.toObject()
    }

    static async deleteUser(userId: string) {
        const user = (await this.getUserById(userId)).toObject()

        if (user.role === 'admin' && user.email === DEFAULT_EMAIL_ADMIN) {
            throw new ConflictRequestError('Không thể xóa tài khoản admin chính')
        }

        await User.findByIdAndDelete(userId)
        return true
    }

    static async setUserActive(userId: string, isActive: boolean) {
        const user = (await this.getUserById(userId)).toObject()

        if (user.role === 'admin' && user.email === DEFAULT_EMAIL_ADMIN) {
            throw new ConflictRequestError('Không thể vô hiệu hoá tài khoản admin chính')
        }

        user.isActive = !!isActive
        await user.save()
        const { password, ...rest } = user.toObject()

        return rest
    }

    static async checkIsExists(collections: RootFilterQuery<IUser>) {
        const user = await User.exists(collections)
        return !!user
    }

    /**
     * Thêm địa chỉ mới cho user
     */
    static async addAddress(userId: string, addressData: any) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        const { name, phone, addressLine, city, ward, location, isDefault: requestedDefault } = addressData

        // Mã hóa các trường nhạy cảm
        const sensitiveData = { name, phone, addressLine }
        const { encryptedData, encryptedKey } = await KeyManagementApiService.encryptDataByApi(sensitiveData)

        // Xác định isDefault
        let isDefault: boolean
        if (requestedDefault === true) {
            // Nếu client yêu cầu set làm default
            isDefault = true
        } else if (requestedDefault === false) {
            // Nếu client yêu cầu không set làm default
            isDefault = false
        } else {
            // Nếu không truyền isDefault, địa chỉ đầu tiên sẽ là default
            isDefault = user.addresses.length === 0
        }

        // Nếu isDefault = true, set tất cả các địa chỉ khác thành false
        if (isDefault) {
            user.addresses.forEach((addr) => {
                addr.isDefault = false
            })
        }

        const newAddress = {
            name: encryptedData.name,
            phone: encryptedData.phone,
            addressLine: encryptedData.addressLine,
            city,
            ward,
            isDefault,
            location: {
                type: 'Point' as const,
                coordinates: location?.coordinates || [0, 0]
            },
            dek: encryptedKey
        }

        user.addresses.push(newAddress)
        await user.save()

        // Trả về địa chỉ đã được giải mã (plain text)
        const savedAddress = user.addresses[user.addresses.length - 1]
        return {
            _id: savedAddress._id,
            city: savedAddress.city,
            ward: savedAddress.ward,
            isDefault: savedAddress.isDefault,
            location: savedAddress.location,
            dek: savedAddress.dek,
            name,
            phone,
            addressLine
        }
    }

    /**
     * Cập nhật địa chỉ mặc định
     */
    static async updateDefaultAddress(userId: string, addressId: string) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        // Tìm địa chỉ cần set làm default
        const addressIndex = user.addresses.findIndex((addr) => addr._id?.toString() === addressId)

        if (addressIndex === -1) {
            throw new NotFoundError('Không tìm thấy địa chỉ')
        }

        // Set tất cả địa chỉ thành false
        user.addresses.forEach((addr) => {
            addr.isDefault = false
        })

        // Set địa chỉ được chọn thành true
        user.addresses[addressIndex].isDefault = true

        await user.save()

        // Giải mã và trả về địa chỉ
        return await this.decryptAddressData(user.addresses[addressIndex])
    }

    /**
     * Cập nhật thông tin địa chỉ
     */
    static async updateAddress(userId: string, addressId: string, addressData: any) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        // Tìm địa chỉ cần cập nhật
        const addressIndex = user.addresses.findIndex((addr) => addr._id?.toString() === addressId)

        if (addressIndex === -1) {
            throw new NotFoundError('Không tìm thấy địa chỉ')
        }

        const { name, phone, addressLine, city, ward, location, isDefault: requestedDefault } = addressData
        const currentAddress = user.addresses[addressIndex]

        // Kiểm tra xem có trường nhạy cảm nào được cập nhật không
        const hasSensitiveUpdate = name !== undefined || phone !== undefined || addressLine !== undefined

        // Khai báo biến để lưu các giá trị plain text
        let plainName: string | undefined
        let plainPhone: string | undefined
        let plainAddressLine: string | undefined

        if (hasSensitiveUpdate) {
            // Giải mã các giá trị hiện tại để lấy plain text
            const currentDek = currentAddress.dek
            let currentPlainData = { name: '', phone: '', addressLine: '' }

            if (currentDek) {
                currentPlainData = await KeyManagementApiService.decryptDataByApi(
                    {
                        name: currentAddress.name,
                        phone: currentAddress.phone,
                        addressLine: currentAddress.addressLine
                    },
                    currentDek
                )
            }

            // Merge: sử dụng giá trị mới nếu có, không thì giữ giá trị cũ đã giải mã
            plainName = name !== undefined ? name : currentPlainData.name
            plainPhone = phone !== undefined ? phone : currentPlainData.phone
            plainAddressLine = addressLine !== undefined ? addressLine : currentPlainData.addressLine

            // Mã hóa lại với DEK mới
            const sensitiveData = { name: plainName, phone: plainPhone, addressLine: plainAddressLine }
            const { encryptedData, encryptedKey } = await KeyManagementApiService.encryptDataByApi(sensitiveData)

            user.addresses[addressIndex].name = encryptedData.name
            user.addresses[addressIndex].phone = encryptedData.phone
            user.addresses[addressIndex].addressLine = encryptedData.addressLine
            user.addresses[addressIndex].dek = encryptedKey
        }

        // Cập nhật các trường không nhạy cảm
        if (city !== undefined) user.addresses[addressIndex].city = city
        if (ward !== undefined) user.addresses[addressIndex].ward = ward
        if (location?.coordinates) {
            user.addresses[addressIndex].location.coordinates = location.coordinates
        }

        // Xử lý isDefault nếu có
        if (requestedDefault === true) {
            // Set tất cả địa chỉ khác thành false
            user.addresses.forEach((addr) => {
                addr.isDefault = false
            })
            // Set địa chỉ này thành true
            user.addresses[addressIndex].isDefault = true
        } else if (requestedDefault === false) {
            user.addresses[addressIndex].isDefault = false

            // Nếu địa chỉ này đang là default và được set thành false,
            // thì set địa chỉ đầu tiên khác làm default
            const hasDefault = user.addresses.some((addr) => addr.isDefault)
            if (!hasDefault && user.addresses.length > 0) {
                user.addresses[0].isDefault = true
            }
        }

        await user.save()

        // Trả về địa chỉ đã được giải mã
        const updatedAddress = user.addresses[addressIndex]
        if (hasSensitiveUpdate) {
            return {
                _id: updatedAddress._id,
                city: updatedAddress.city,
                ward: updatedAddress.ward,
                isDefault: updatedAddress.isDefault,
                location: updatedAddress.location,
                name: plainName,
                phone: plainPhone,
                addressLine: plainAddressLine
            }
        }

        // Nếu không cập nhật trường nhạy cảm, giải mã và trả về
        return await this.decryptAddressData(updatedAddress)
    }

    /**
     * Lấy danh sách địa chỉ của user
     */
    static async getAddresses(userId: string) {
        const user = await User.findById(userId).select('addresses')
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        // Giải mã các trường nhạy cảm cho mỗi địa chỉ
        const decryptedAddresses = await Promise.all(user.addresses.map((address) => this.decryptAddressData(address)))

        return decryptedAddresses
    }

    /**
     * Xóa địa chỉ
     */
    static async deleteAddress(userId: string, addressId: string) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError(AUTH.USER_NOT_FOUND)
        }

        const addressIndex = user.addresses.findIndex((addr) => addr._id?.toString() === addressId)

        if (addressIndex === -1) {
            throw new NotFoundError('Không tìm thấy địa chỉ')
        }

        const wasDefault = user.addresses[addressIndex].isDefault

        // Xóa địa chỉ
        user.addresses.splice(addressIndex, 1)

        // Nếu địa chỉ bị xóa là default và còn địa chỉ khác, set địa chỉ đầu tiên làm default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true
        }

        await user.save()

        return true
    }
}

export default UserService
