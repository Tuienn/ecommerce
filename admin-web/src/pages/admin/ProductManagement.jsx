import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Popconfirm,
    Tag,
    Switch,
    Typography,
    Card,
    Tooltip,
    Image,
    Upload,
    message
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import ProductService from '../../services/product.service'
import CategoryService from '../../services/category.service'
import { useApp } from '../../components/provider/AppProvider'

const { Title } = Typography
const { TextArea } = Input

// Đơn vị sản phẩm
const UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'gram', label: 'Gram' },
    { value: 'gói', label: 'Gói' },
    { value: 'chai', label: 'Chai' },
    { value: 'hộp', label: 'Hộp' },
    { value: 'thùng', label: 'Thùng' },
    { value: 'cái', label: 'Cái' },
    { value: 'bó', label: 'Bó' },
    { value: 'túi', label: 'Túi' }
]

const ProductManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [fileList, setFileList] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const { showNotification } = useApp()

    // Query danh sách sản phẩm với pagination
    const {
        data: productsData,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['products', currentPage, pageSize],
        queryFn: () => ProductService.getAllProducts({ page: currentPage, limit: pageSize })
    })

    // Query danh sách danh mục
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: CategoryService.getAllCategories
    })

    // API trả về { data: { data: products, pagination } }
    const products = productsData?.data?.data || []
    const pagination = productsData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
    const categories = categoriesData?.data || []

    // Mutation tạo sản phẩm
    const createMutation = useMutation({
        mutationFn: ProductService.createProduct,
        onSuccess: () => {
            showNotification('success', 'Tạo sản phẩm thành công')
            queryClient.invalidateQueries({ queryKey: ['products'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Tạo sản phẩm thất bại')
        }
    })

    // Mutation cập nhật sản phẩm
    const updateMutation = useMutation({
        mutationFn: ({ id, data, hasNewFiles }) => {
            if (hasNewFiles) {
                return ProductService.updateProductWithUpload(id, data)
            }
            return ProductService.updateProduct(id, data)
        },
        onSuccess: () => {
            showNotification('success', 'Cập nhật sản phẩm thành công')
            queryClient.invalidateQueries({ queryKey: ['products'] })
            handleCloseModal()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Cập nhật sản phẩm thất bại')
        }
    })

    // Mutation xóa sản phẩm
    const deleteMutation = useMutation({
        mutationFn: ProductService.deleteProduct,
        onSuccess: () => {
            showNotification('success', 'Xóa sản phẩm thành công')
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Xóa sản phẩm thất bại')
        }
    })

    // Mutation thay đổi trạng thái
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }) => ProductService.setActiveProduct(id, isActive),
        onSuccess: (_, variables) => {
            const msg = variables.isActive ? 'Đã bật sản phẩm' : 'Đã tắt sản phẩm'
            showNotification('success', msg)
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (error) => {
            showNotification('error', error.message || 'Thay đổi trạng thái thất bại')
        }
    })

    // Mở modal thêm mới
    const handleOpenAddModal = () => {
        setEditingProduct(null)
        form.resetFields()
        setFileList([])
        setIsModalOpen(true)
    }

    // Mở modal sửa
    const handleOpenEditModal = (record) => {
        setEditingProduct(record)
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            categoryId: record.categoryId?._id || record.categoryId,
            basePrice: record.basePrice,
            discountPercent: record.discountPercent,
            unit: record.unit,
            stock: record.stock,
            isFeatured: record.isFeatured
        })
        // Convert existing images to fileList format
        const existingFiles = (record.images || []).map((url, index) => ({
            uid: `-${index}`,
            name: `image-${index}`,
            status: 'done',
            url: url
        }))
        setFileList(existingFiles)
        setIsModalOpen(true)
    }

    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingProduct(null)
        form.resetFields()
        setFileList([])
    }

    // Submit form
    const handleSubmit = (values) => {
        const formData = new FormData()

        // Add basic fields
        formData.append('name', values.name)
        formData.append('categoryId', values.categoryId)
        formData.append('basePrice', values.basePrice)
        formData.append('unit', values.unit || 'kg')

        if (values.description) {
            formData.append('description', values.description)
        }
        if (values.discountPercent !== undefined) {
            formData.append('discountPercent', values.discountPercent)
        }
        if (values.stock !== undefined) {
            formData.append('stock', values.stock)
        }
        if (values.isFeatured !== undefined) {
            formData.append('isFeatured', values.isFeatured)
        }

        // Handle images
        const newFiles = fileList.filter((file) => file.originFileObj)
        const existingUrls = fileList.filter((file) => file.url && !file.originFileObj).map((file) => file.url)

        // Add new files
        newFiles.forEach((file) => {
            formData.append('files', file.originFileObj)
        })

        // Add existing image URLs for update
        if (editingProduct && existingUrls.length > 0) {
            formData.append('existingImages', JSON.stringify(existingUrls))
        }

        if (editingProduct) {
            updateMutation.mutate({
                id: editingProduct._id,
                data: newFiles.length > 0 ? formData : values,
                hasNewFiles: newFiles.length > 0
            })
        } else {
            if (newFiles.length === 0) {
                message.warning('Vui lòng chọn ít nhất 1 ảnh sản phẩm')
                return
            }
            createMutation.mutate(formData)
        }
    }

    // Xóa sản phẩm
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

    // Handle upload change
    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList)
    }

    // Format tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price)
    }

    // Cấu hình columns cho Table
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 80,
            render: (images) => (
                <Image
                    src={images?.[0] || '/placeholder.png'}
                    alt='Product'
                    width={50}
                    height={50}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesrnvkAADcBSURBVO+'
                />
            )
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 200
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryId',
            key: 'categoryId',
            width: 120,
            render: (category) => category?.name || 'N/A'
        },
        {
            title: 'Giá gốc',
            dataIndex: 'basePrice',
            key: 'basePrice',
            width: 120,
            align: 'right',
            render: (price) => formatPrice(price)
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discountPercent',
            key: 'discountPercent',
            width: 90,
            align: 'center',
            render: (percent) => (percent > 0 ? <Tag color='red'>-{percent}%</Tag> : '-')
        },
        {
            title: 'Giá bán',
            dataIndex: 'price',
            key: 'price',
            width: 120,
            align: 'right',
            render: (price) => <span className='font-semibold text-green-600'>{formatPrice(price)}</span>
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stock',
            key: 'stock',
            width: 90,
            align: 'center',
            render: (stock) => (
                <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
                    {stock} {stock === 0 ? '(Hết)' : ''}
                </Tag>
            )
        },
        {
            title: 'Đơn vị',
            dataIndex: 'unit',
            key: 'unit',
            width: 80,
            align: 'center'
        },
        {
            title: 'Nổi bật',
            dataIndex: 'isFeatured',
            key: 'isFeatured',
            width: 90,
            align: 'center',
            render: (isFeatured) => <Tag color={isFeatured ? 'gold' : 'default'}>{isFeatured ? '⭐ Có' : 'Không'}</Tag>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 100,
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
                        description='Bạn có chắc chắn muốn xóa sản phẩm này?'
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
                        Quản lý sản phẩm
                    </Title>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                            Làm mới
                        </Button>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleOpenAddModal}>
                            Thêm sản phẩm
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey='_id'
                    loading={isLoading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                    bordered
                    size='middle'
                    scroll={{ x: 1400 }}
                />
            </Card>

            <Modal
                title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
                width={700}
            >
                <Form form={form} layout='vertical' onFinish={handleSubmit} className='mt-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <Form.Item
                            name='name'
                            label='Tên sản phẩm'
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên sản phẩm' },
                                { max: 200, message: 'Tên không được quá 200 ký tự' }
                            ]}
                            className='col-span-2'
                        >
                            <Input placeholder='Nhập tên sản phẩm' />
                        </Form.Item>

                        <Form.Item
                            name='categoryId'
                            label='Danh mục'
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                        >
                            <Select placeholder='Chọn danh mục'>
                                {categories.map((cat) => (
                                    <Select.Option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name='unit' label='Đơn vị' initialValue='kg'>
                            <Select placeholder='Chọn đơn vị'>
                                {UNIT_OPTIONS.map((opt) => (
                                    <Select.Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name='basePrice'
                            label='Giá gốc (VNĐ)'
                            rules={[{ required: true, message: 'Vui lòng nhập giá gốc' }]}
                        >
                            <InputNumber
                                min={0}
                                step={1000}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                placeholder='0'
                                className='w-full'
                            />
                        </Form.Item>

                        <Form.Item name='discountPercent' label='Giảm giá (%)' initialValue={0}>
                            <InputNumber min={0} max={100} placeholder='0' className='w-full' />
                        </Form.Item>

                        <Form.Item name='stock' label='Số lượng tồn kho' initialValue={0}>
                            <InputNumber min={0} placeholder='0' className='w-full' />
                        </Form.Item>

                        <Form.Item name='isFeatured' label='Sản phẩm nổi bật' valuePropName='checked'>
                            <Switch checkedChildren='Có' unCheckedChildren='Không' />
                        </Form.Item>

                        <Form.Item name='description' label='Mô tả' className='col-span-2'>
                            <TextArea rows={3} placeholder='Nhập mô tả sản phẩm' maxLength={2000} showCount />
                        </Form.Item>

                        <Form.Item label='Hình ảnh sản phẩm' className='col-span-2'>
                            <Upload
                                listType='picture-card'
                                fileList={fileList}
                                onChange={handleUploadChange}
                                beforeUpload={() => false}
                                multiple
                                accept='image/*'
                            >
                                {fileList.length >= 10 ? null : (
                                    <div>
                                        <UploadOutlined />
                                        <div className='mt-2'>Tải ảnh</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    </div>

                    <div className='flex justify-end gap-2'>
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}

export default ProductManagement
