import { User } from '../index.model'
import { hash } from 'bcryptjs'
import { NotFoundError, ConflictRequestError } from '../../exceptions/error.handler'
import { IUser } from '../../types/user'
import { RootFilterQuery } from 'mongoose'

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
                isActive: true
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

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new ConflictRequestError('Email này đã được sử dụng')
        }

        const newUser = await User.create({
            name,
            email,
            password,
            phone,
            role
        })

        const userResponse = newUser.toObject()
        const { password: _, ...userWithoutPassword } = userResponse

        return userWithoutPassword
    }

    static async getUserById(userId: string) {
        const user = await User.findById(userId).select('-password')

        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }

        const obj = user.toObject()

        return obj
    }

    static async updateUser(userId: string, data: IUser) {
        const { email, role, password, isActive, name } = data

        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email })
            if (existingUser) {
                throw new ConflictRequestError('Email này đã được sử dụng')
            }
        }

        const updateData: Partial<IUser> = {}
        if (email) updateData.email = email
        if (name) updateData.name = name
        if (role) updateData.role = role
        if (password) {
            updateData.password = await hash(password, 10)
        }
        if (typeof isActive === 'boolean') updateData.isActive = isActive

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')

        if (!updatedUser) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }
        const obj = updatedUser.toObject()

        return obj
    }

    static async deleteUser(userId: string) {
        const user = await User.findById(userId)
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng')
        }

        await User.findByIdAndDelete(userId)
        return { message: 'Xóa người dùng thành công' }
    }

    static async setUserActive(userId: string, isActive: boolean) {
        const user = await User.findById(userId)
        if (!user) throw new NotFoundError('Không tìm thấy người dùng')
        if (user.role === 'admin' && user.email === DEFAULT_EMAIL_ADMIN) {
            throw new ConflictRequestError('Không thể vô hiệu hoá tài khoản admin chính')
        }
        user.isActive = !!isActive
        await user.save()
        const obj = user.toObject()
        const { password, ...rest } = obj

        return rest
    }

    static async checkIsExists(collections: RootFilterQuery<IUser>) {
        const user = await User.exists(collections)
        return !!user
    }
}

export default UserService
