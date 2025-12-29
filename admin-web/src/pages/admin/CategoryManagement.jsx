import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, Switch, Typography, Card, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import CategoryService from '../../services/category.service'
import { useApp } from '../../components/provider/AppProvider'

const { Title } = Typography

const CategoryManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const { showNotification } = useApp()

    // Query danh sách danh mục
    const {
        data: categoriesData,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['categories'],
        queryFn: CategoryService.getAllCategories
    })

    const categories = categoriesData?.data || []

    // Mutation tạo danh mục
    const createMutation = useMutation({
        mutationFn: CategoryService.createCategory,
        onSuccess: () => {
            showNotification('success', 'Tạo danh mục thành công')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Tạo danh mục thất bại')
        }
    })

    // Mutation cập nhật danh mục
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => CategoryService.updateCategory(id, data),
        onSuccess: () => {
            showNotification('success', 'Cập nhật danh mục thành công')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Cập nhật danh mục thất bại')
        }
    })

    // Mutation xóa danh mục
    const deleteMutation = useMutation({
        mutationFn: CategoryService.deleteCategory,
        onSuccess: () => {
            showNotification('success', 'Xóa danh mục thành công')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Xóa danh mục thất bại')
        }
    })

    // Mutation thay đổi trạng thái
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }) => CategoryService.setActiveCategory(id, isActive),
        onSuccess: (_, variables) => {
            const message = variables.isActive ? 'Đã bật danh mục' : 'Đã tắt danh mục'
            showNotification('success', message)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Thay đổi trạng thái thất bại')
        }
    })

    // Mở modal thêm mới
    const handleOpenAddModal = () => {
        setEditingCategory(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    // Mở modal sửa
    const handleOpenEditModal = (record) => {
        setEditingCategory(record)
        form.setFieldsValue({
            name: record.name
        })
        setIsModalOpen(true)
    }

    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingCategory(null)
        form.resetFields()
    }

    // Submit form
    const handleSubmit = (values) => {
        if (editingCategory) {
            updateMutation.mutate({
                id: editingCategory._id,
                data: values
            })
        } else {
            createMutation.mutate(values)
        }
    }

    // Xóa danh mục
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

    // Cấu hình columns cho Table
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 70,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true
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
                    checkedChildren='Bật'
                    unCheckedChildren='Tắt'
                />
            )
        },
        {
            title: 'Hiển thị',
            key: 'status',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Tag color={record.isActive ? 'success' : 'default'}>{record.isActive ? 'Hiện' : 'Ẩn'}</Tag>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date) =>
                new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size='small'>
                    <Tooltip title='Sửa'>
                        <Button type='text' icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title='Xác nhận xóa'
                        description='Bạn có chắc chắn muốn xóa danh mục này?'
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
                <div className='mb-4 flex items-center justify-between'>
                    <Title level={4} className='!mb-0'>
                        Quản lý danh mục
                    </Title>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                            Làm mới
                        </Button>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                            Thêm danh mục
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey='_id'
                    loading={isLoading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục`
                    }}
                    bordered
                    size='middle'
                />
            </Card>

            <Modal
                title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout='vertical' onFinish={handleSubmit} className='mt-4'>
                    <Form.Item
                        name='name'
                        label='Tên danh mục'
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên danh mục' },
                            { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
                            { max: 100, message: 'Tên danh mục không được quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder='Nhập tên danh mục' />
                    </Form.Item>

                    <div className='flex justify-end gap-2'>
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default CategoryManagement
