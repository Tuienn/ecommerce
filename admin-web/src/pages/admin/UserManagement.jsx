import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Popconfirm,
    Tag,
    Switch,
    Typography,
    Card,
    Tooltip,
    Avatar
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    GoogleOutlined
} from '@ant-design/icons'
import UserService from '../../services/user.service'
import { useApp } from '../../components/provider/AppProvider'

const { Title } = Typography

// Role options
const ROLE_OPTIONS = [
    { value: 'admin', label: 'Quản trị viên', color: 'red' },
    { value: 'staff', label: 'Nhân viên', color: 'blue' },
    { value: 'customer', label: 'Khách hàng', color: 'green' }
]

const UserManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [filterRole, setFilterRole] = useState(null)
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const { showNotification } = useApp()

    // Query danh sách người dùng với pagination
    const {
        data: usersData,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['users', currentPage, pageSize, filterRole],
        queryFn: () =>
            UserService.getAllUsers({
                page: currentPage,
                limit: pageSize,
                ...(filterRole && { role: filterRole })
            })
    })

    // API trả về { data: { data: users, pagination } }
    const users = usersData?.data?.data || []
    const pagination = usersData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

    // Mutation tạo người dùng
    const createMutation = useMutation({
        mutationFn: UserService.createUser,
        onSuccess: () => {
            showNotification('success', 'Tạo người dùng thành công')
            queryClient.invalidateQueries({ queryKey: ['users'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Tạo người dùng thất bại')
        }
    })

    // Mutation cập nhật người dùng
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => UserService.updateUser(id, data),
        onSuccess: () => {
            showNotification('success', 'Cập nhật người dùng thành công')
            queryClient.invalidateQueries({ queryKey: ['users'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Cập nhật người dùng thất bại')
        }
    })

    // Mutation xóa người dùng
    const deleteMutation = useMutation({
        mutationFn: UserService.deleteUser,
        onSuccess: () => {
            showNotification('success', 'Xóa người dùng thành công')
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Xóa người dùng thất bại')
        }
    })

    // Mutation thay đổi trạng thái
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }) => UserService.setActiveUser(id, isActive),
        onSuccess: (_, variables) => {
            const msg = variables.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản'
            showNotification('success', msg)
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Thay đổi trạng thái thất bại')
        }
    })

    // Mở modal thêm mới
    const handleOpenAddModal = () => {
        setEditingUser(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    // Mở modal sửa
    const handleOpenEditModal = (record) => {
        setEditingUser(record)
        form.setFieldsValue({
            name: record.name,
            email: record.email,
            phone: record.phone,
            role: record.role
        })
        setIsModalOpen(true)
    }

    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingUser(null)
        form.resetFields()
    }

    // Submit form
    const handleSubmit = (values) => {
        if (editingUser) {
            // Khi update, không gửi password nếu không thay đổi
            const updateData = { ...values }
            if (!updateData.password) {
                delete updateData.password
            }
            updateMutation.mutate({
                id: editingUser._id,
                data: updateData
            })
        } else {
            createMutation.mutate(values)
        }
    }

    // Xóa người dùng
    const handleDelete = (id) => {
        deleteMutation.mutate(id)
    }

    // Toggle trạng thái active
    const handleToggleActive = (record) => {
        toggleActiveMutation.mutate({
            id: record._id,
            isActive: !record.isActive
        })
    }

    // Get role tag color
    const getRoleTag = (role) => {
        const roleOption = ROLE_OPTIONS.find((r) => r.value === role)
        return <Tag color={roleOption?.color || 'default'}>{roleOption?.label || role}</Tag>
    }

    // Get first letter for avatar
    const getAvatarLetter = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?'
    }

    // Cấu hình columns cho Table
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1
        },
        {
            title: 'Người dùng',
            key: 'user',
            width: 250,
            render: (_, record) => (
                <div className='flex items-center gap-3'>
                    <Avatar
                        size={40}
                        style={{ backgroundColor: record.googleId ? '#DB4437' : '#1890ff' }}
                        icon={record.googleId ? <GoogleOutlined /> : <UserOutlined />}
                    >
                        {!record.googleId && getAvatarLetter(record.name)}
                    </Avatar>
                    <div>
                        <div className='font-medium'>{record.name}</div>
                        <div className='text-xs text-gray-500'>{record.email}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (phone) => (
                <span>
                    <PhoneOutlined className='mr-1' />
                    {phone}
                </span>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 130,
            align: 'center',
            render: (role) => getRoleTag(role)
        },
        {
            title: 'Đăng nhập',
            key: 'loginType',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Tag
                    color={record.googleId ? 'volcano' : 'geekblue'}
                    icon={record.googleId ? <GoogleOutlined /> : <MailOutlined />}
                >
                    {record.googleId ? 'Google' : 'Email'}
                </Tag>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            align: 'center',
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={() => handleToggleActive(record)}
                    loading={toggleActiveMutation.isPending}
                    checkedChildren='Hoạt động'
                    unCheckedChildren='Vô hiệu'
                />
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) =>
                new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Tooltip title='Sửa'>
                        <Button type='text' icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title='Xác nhận xóa'
                        description='Bạn có chắc chắn muốn xóa người dùng này?'
                        onConfirm={() => handleDelete(record._id)}
                        okText='Xóa'
                        cancelText='Hủy'
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title='Xóa'>
                            <Button type='text' danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div className='p-4'>
            <Card>
                <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <Title level={4} className='!mb-0'>
                        Quản lý người dùng
                    </Title>
                    <Space wrap>
                        <Select
                            placeholder='Lọc theo vai trò'
                            allowClear
                            style={{ width: 160 }}
                            value={filterRole}
                            onChange={(value) => {
                                setFilterRole(value)
                                setCurrentPage(1)
                            }}
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <Select.Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Select.Option>
                            ))}
                        </Select>
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                            Làm mới
                        </Button>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                            Thêm người dùng
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey='_id'
                    loading={isLoading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                    bordered
                    size='middle'
                    scroll={{ x: 1100 }}
                />
            </Card>

            <Modal
                title={editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
                width={500}
            >
                <Form form={form} layout='vertical' onFinish={handleSubmit} className='mt-4'>
                    <Form.Item
                        name='name'
                        label='Họ và tên'
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ tên' },
                            { max: 100, message: 'Họ tên không được quá 100 ký tự' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder='Nhập họ và tên' />
                    </Form.Item>

                    <Form.Item
                        name='email'
                        label='Email'
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder='Nhập email' disabled={!!editingUser} />
                    </Form.Item>

                    <Form.Item
                        name='phone'
                        label='Số điện thoại'
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                        ]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder='Nhập số điện thoại' />
                    </Form.Item>

                    <Form.Item
                        name='role'
                        label='Vai trò'
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                        initialValue='customer'
                    >
                        <Select placeholder='Chọn vai trò'>
                            {ROLE_OPTIONS.map((opt) => (
                                <Select.Option key={opt.value} value={opt.value}>
                                    <Tag color={opt.color}>{opt.label}</Tag>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name='password'
                            label='Mật khẩu'
                            rules={[
                                { required: !editingUser, message: 'Vui lòng nhập mật khẩu' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                            ]}
                        >
                            <Input.Password placeholder='Nhập mật khẩu' />
                        </Form.Item>
                    )}

                    {editingUser && (
                        <Form.Item
                            name='password'
                            label='Mật khẩu mới (để trống nếu không đổi)'
                            rules={[{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }]}
                        >
                            <Input.Password placeholder='Nhập mật khẩu mới' />
                        </Form.Item>
                    )}

                    <div className='flex justify-end gap-2'>
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingUser ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default UserManagement
