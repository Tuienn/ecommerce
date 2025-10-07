import { existedDataField } from './../../constants/text'
import { User } from '../index.model'
import { ConflictRequestError, NotFoundError } from '../../exceptions/error.handler'
import { IUser } from '../../types/user'
import { RootFilterQuery } from 'mongoose'
import { AUTH } from '../../constants/text'
import { hashPassword } from '../../utils/crypto'

const { DEFAULT_EMAIL_ADMIN, DEFAULT_PASSWORD_ADMIN } = process.env

class UserService {
    static async createDefaultAdmin() {
        const existingAdmin = await User.findOne({ email: DEFAULT_EMAIL_ADMIN })

        if (!existingAdmin) {
            const defaultAdmin = await User.create({
                name: 'Administrator',
                email: DEFAULT_EMAIL_ADMIN,
                password: DEFAULT_PASSWORD_ADMIN,
                role: 'admin',
                phone: '0942029135'
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
}

export default UserService
