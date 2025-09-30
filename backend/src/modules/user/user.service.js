const { User } = require('../index.model')
const bcrypt = require('bcryptjs')
const { NotFoundError, ConflictRequestError } = require('../../exceptions/error.models')

const { DEFAULT_EMAIL_ADMIN, DEFAULT_PASSWORD_ADMIN } = process.env

const createDefaultAdmin = async () => {
    try {
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
    } catch (error) {
        console.error('Error creating default admin user:', error)
        throw error
    }
}

const createUser = async (data) => {
    const { name, email, password, role, isActive } = data

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new ConflictRequestError('Email này đã được sử dụng')
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role,
        isActive: isActive !== undefined ? !!isActive : true
    })

    const userResponse = newUser.toObject()
    delete userResponse.password

    return userResponse
}

const listUsers = async ({ page = 1, limit = 20, search = '' } = {}) => {
    const query = { role: { $ne: 'admin' } } // exclude admin users
    if (search) {
        query.email = { $regex: search, $options: 'i' }
    }
    const options = {
        page: Number(page) || 1,
        limit: Math.min(Number(limit) || 20, 100),
        select: '-password',
        sort: { createdAt: -1 }
    }
    const result = await User.paginate(query, options)
    // map docs' permissions to nested shape
    result.docs = result.docs.map((doc) => {
        const obj = doc.toObject ? doc.toObject() : doc
        return obj
    })
    return result
}

const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password')

    if (!user) {
        throw new NotFoundError('Không tìm thấy người dùng')
    }

    const obj = user.toObject()

    return obj
}

const updateUser = async (userId, data) => {
    const { email, role, password, isActive, permissions, name } = data

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

    const updateData = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (password) {
        updateData.password = await bcrypt.hash(password, 10)
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')
    const obj = updatedUser.toObject()

    return obj
}

const deleteUser = async (userId) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new NotFoundError('Không tìm thấy người dùng')
    }

    await User.findByIdAndDelete(userId)
    return { message: 'Xóa người dùng thành công' }
}

const setUserActive = async (userId, isActive) => {
    const user = await User.findById(userId)
    if (!user) throw new NotFoundError('Không tìm thấy người dùng')
    if (user.role === 'admin' && user.email === DEFAULT_EMAIL_ADMIN) {
        throw new ConflictRequestError('Không thể vô hiệu hoá tài khoản admin chính')
    }
    user.isActive = !!isActive
    await user.save()
    const obj = user.toObject()
    delete obj.password

    return obj
}

module.exports = { createDefaultAdmin, createUser, listUsers, getUserById, updateUser, deleteUser, setUserActive }
